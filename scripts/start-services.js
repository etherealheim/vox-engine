#!/usr/bin/env node

/**
 * Service Launcher
 * This script starts all the required services for the application
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for colorful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Service definitions
const services = [
  {
    name: 'Unified Scraper Service',
    command: 'node',
    args: ['src/scraper-ui.js'],
    color: colors.blue,
    port: 3003,
  },
  {
    name: 'Next.js Server',
    command: 'npm',
    args: ['run', 'next-dev'],
    color: colors.magenta,
    port: 3000,
  },
];

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Check if the script is being run with the --help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Vox Engine Service Launcher${colors.reset}

This script starts all the services required for the Vox Engine application.

${colors.bright}Usage:${colors.reset}
  node scripts/start-services.js [options]

${colors.bright}Options:${colors.reset}
  --help, -h     Show this help message
  --twitter      Start only the Twitter scraper
  --vote         Start only the Vote scraper
  --next         Start only the Next.js server
  
${colors.bright}Examples:${colors.reset}
  node scripts/start-services.js           # Start all services
  node scripts/start-services.js --twitter # Start only Twitter scraper
  `);
  process.exit(0);
}

// Parse command line arguments to determine which services to start
const startTwitter = process.argv.includes('--twitter') || !process.argv.slice(2).length;
const startVote = process.argv.includes('--vote') || !process.argv.slice(2).length;
const startNext = process.argv.includes('--next') || !process.argv.slice(2).length;

// Filter services based on command line arguments
const servicesToStart = services.filter(service => {
  if (service.name === 'Twitter Scraper' && !startTwitter) return false;
  if (service.name === 'Vote Scraper' && !startVote) return false;
  if (service.name === 'Next.js Server' && !startNext) return false;
  return true;
});

// Print banner
console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗
║                 VOX ENGINE SERVICE LAUNCHER                ║
╚════════════════════════════════════════════════════════╝${colors.reset}
`);

// Start each service
const runningProcesses = [];

servicesToStart.forEach(service => {
  console.log(`${service.color}[${service.name}]${colors.reset} Starting...`);
  
  const process = spawn(service.command, service.args, {
    stdio: 'pipe',
    shell: true,
  });
  
  runningProcesses.push(process);
  
  process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}]${colors.reset} ${line}`);
      }
    });
  });
  
  process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}]${colors.red} ERROR:${colors.reset} ${line}`);
      }
    });
  });
  
  process.on('close', (code) => {
    if (code === 0) {
      console.log(`${service.color}[${service.name}]${colors.reset} Stopped gracefully.`);
    } else {
      console.log(`${service.color}[${service.name}]${colors.red} Exited with code ${code}${colors.reset}`);
      
      // Restart the service after a delay
      console.log(`${service.color}[${service.name}]${colors.yellow} Restarting in 5 seconds...${colors.reset}`);
      setTimeout(() => {
        const newProcess = spawn(service.command, service.args, {
          stdio: 'pipe',
          shell: true,
        });
        
        // Replace the old process with the new one
        const index = runningProcesses.indexOf(process);
        if (index !== -1) {
          runningProcesses[index] = newProcess;
        }
        
        console.log(`${service.color}[${service.name}]${colors.green} Restarted!${colors.reset}`);
        
        // Set up the same event handlers for the new process
        newProcess.stdout.on('data', (data) => {
          const lines = data.toString().trim().split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              console.log(`${service.color}[${service.name}]${colors.reset} ${line}`);
            }
          });
        });
        
        newProcess.stderr.on('data', (data) => {
          const lines = data.toString().trim().split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              console.log(`${service.color}[${service.name}]${colors.red} ERROR:${colors.reset} ${line}`);
            }
          });
        });
      }, 5000);
    }
  });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down all services...${colors.reset}`);
  
  runningProcesses.forEach(process => {
    process.kill('SIGINT');
  });
  
  // Give processes a chance to shut down gracefully
  setTimeout(() => {
    console.log(`${colors.green}All services stopped.${colors.reset}`);
    process.exit(0);
  }, 1000);
});

console.log(`\n${colors.green}All services started. Press Ctrl+C to stop.${colors.reset}\n`); 