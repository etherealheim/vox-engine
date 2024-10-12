// scrape-vote.ts

import puppeteer from 'puppeteer';
import 'dotenv/config';

// Function to remove diacritics from a string
function removeDiacritics(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Function to scrape voting data
export async function scrapeVotingData(startG: number, endG: number) {
    const votingSessionsData = [];
    const politiciansData = new Map(); // Use a map to avoid duplicates
    const votesData = [];

    try {
        // Loop through the range of 'g' values
        for (let g = startG; g <= endG; g++) {
            console.log(`Processing voting session with g=${g}`);

            // Launch the browser and open a new blank page
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();

            // Construct the URL with the current 'g' value
            const url = `https://www.psp.cz/sqw/hlasy.sqw?g=${g}`;

            // Navigate the page to the target URL
            await page.goto(url, { waitUntil: 'networkidle0' });

            // Wait for the H1 element to be loaded
            const h1Selector = 'h1.page-title-x';
            const h1Element = await page.$(h1Selector);

            if (!h1Element) {
                console.warn(`No voting session found at g=${g}. Skipping...`);
                await browser.close();
                continue;
            }

            // Get the inner text to preserve line breaks
            const h1Text = await h1Element.evaluate(el => el.innerText);

            // Split the content based on the line breaks
            const [meetingInfo, title] = h1Text?.split('\n') ?? ['', ''];

            // Clean up meetingInfo by removing extra whitespace and non-breaking spaces
            const cleanedMeetingInfo = meetingInfo.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ');

            // Extract the rest of the meeting details
            const meetingDetails = cleanedMeetingInfo.trim();

            // Czech month mapping
            const czechMonths: { [key: string]: string } = {
                'ledna': '01',
                'února': '02',
                'března': '03',
                'dubna': '04',
                'května': '05',
                'června': '06',
                'července': '07',
                'srpna': '08',
                'září': '09',
                'října': '10',
                'listopadu': '11',
                'prosince': '12'
            };

            // Improved regex to extract date and time from the meetingDetails string
            const dateTimeMatch = meetingDetails.match(
                /(\d{1,2})\.\s*([^\d\s,]+(?:\s+[^\d\s,]+)*)\s*(\d{4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)/
            );

            let isoDate = null;
            let time = null;

            if (dateTimeMatch) {
                const day = dateTimeMatch[1];
                const monthName = dateTimeMatch[2].toLowerCase();
                const year = dateTimeMatch[3];
                time = dateTimeMatch[4];

                const month = czechMonths[monthName];

                if (month) {
                    isoDate = `${year}-${month}-${day.padStart(2, '0')}`;
                } else {
                    console.error('Unknown month name:', monthName);
                }
            } else {
                console.error('Date and time not found in meeting details.');
            }

            console.log('Date:', isoDate);
            console.log('Time:', time);
            console.log('Title:', title.trim());
            console.log('Meeting Details:', meetingDetails);

            // Store voting session data
            votingSessionsData.push({
                sessionId: g,
                date: isoDate,
                time: time,
                title: title.trim(),
                meetingDetails: meetingDetails,
            });

            // Wait for voting sections to be loaded
            await page.waitForSelector('h2.section-title.center');

            // Extract each individual vote, name, party, and result
            const votingSections = await page.$$('h2.section-title.center');
            console.log('Number of voting sections found:', votingSections.length);

            for (const section of votingSections) {
                const partyInfo = await section.evaluate(el => el.textContent?.trim() || '');
                const partyMatch = partyInfo.match(/(.+?)\s*\(/);
                const partyName = partyMatch ? partyMatch[1].trim() : 'Unknown Party';

                // Skip sections that are not party sections
                if (partyName === 'Unknown Party') {
                    console.warn('Skipping section with unrecognized party name:', partyInfo);
                    continue;
                }

                // Function to find the next sibling <ul class="results">
                const voteListHandle = await section.evaluateHandle((el) => {
                    let sibling = el.nextElementSibling;
                    while (sibling) {
                        if (sibling.tagName === 'UL' && sibling.classList.contains('results')) {
                            return sibling;
                        }
                        sibling = sibling.nextElementSibling;
                    }
                    return null;
                });

                if (!voteListHandle) {
                    console.error('No voting list found for:', partyName);
                    continue;
                }

                // Convert JSHandle to ElementHandle
                const voteListElementHandle = voteListHandle.asElement();

                if (!voteListElementHandle) {
                    console.error('voteListHandle is not an ElementHandle for:', partyName);
                    continue;
                }

                // Now get the <li> elements inside the <ul>
                const voteItems = await voteListElementHandle.$$('li');
                console.log(`Processing ${voteItems.length} votes for party: ${partyName}`);

                for (const item of voteItems) {
                    const name = await item.$eval('a', el => el.textContent?.trim() || '');
                    const voteSymbol = await item.$eval('span.flag', el => el.textContent?.trim() || '');
                    let vote: string;
                    switch (voteSymbol) {
                        case 'A':
                            vote = 'Yes';
                            break;
                        case 'N':
                            vote = 'No';
                            break;
                        case 'Z':
                            vote = 'Refrained';
                            break;
                        case '0':
                            vote = 'Not logged in';
                            break;
                        case 'M':
                            vote = 'Excused';
                            break;
                        default:
                            vote = 'Unknown';
                    }

                    // Generate a handle (e.g., "vera-adamkova")
                    const normalizedName = removeDiacritics(name);
                    const handle = normalizedName
                        .toLowerCase()
                        .replace(/\s+/g, '-') // Replace spaces with hyphens
                        .replace(/[^a-z0-9-]+/g, ''); // Remove non-alphanumeric characters except hyphens

                    // Store politician data if not already stored
                    if (!politiciansData.has(handle)) {
                        politiciansData.set(handle, {
                            name,
                            handle,
                            twitter: null, // Placeholder
                            wikipedia: null, // Placeholder
                        });
                    }

                    // Store vote data
                    votesData.push({
                        politicianHandle: handle,
                        sessionId: g,
                        vote,
                        partyName,
                        voteDate: isoDate,
                    });
                }

                // Dispose of handles
                await voteListHandle.dispose();
                await voteListElementHandle.dispose();
            }

            await browser.close();
            console.log(`Data scraping for g=${g} completed successfully.`);
        }

        console.log('All voting sessions processed.');
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return { votingSessionsData, politiciansData: Array.from(politiciansData.values()), votesData };
}
