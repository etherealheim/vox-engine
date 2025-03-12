CREATE TABLE IF NOT EXISTS "parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"short_name" varchar(20),
	"logo_url" text,
	"website" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "politicians" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"party_id" integer,
	"twitter_handle" varchar(50),
	"official_title" varchar(100),
	"biography" text,
	"profile_image_url" text,
	"is_verified" boolean DEFAULT false,
	"last_twitter_sync" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"message" text,
	"details" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tweet_vote_associations" (
	"tweet_id" integer NOT NULL,
	"vote_id" integer NOT NULL,
	"confidence_score" integer,
	"association_type" varchar(50),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tweet_vote_associations_tweet_id_vote_id_pk" PRIMARY KEY("tweet_id","vote_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tweets" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(50) NOT NULL,
	"politician_id" integer NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"posted_at" timestamp NOT NULL,
	"media_urls" json,
	"metrics" json,
	"related_session_id" integer,
	"sentiment_score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tweets_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"politician_id" integer NOT NULL,
	"vote" varchar(20) NOT NULL,
	"comment" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(50),
	"title" varchar(200) NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"category" varchar(100),
	"result_summary" json,
	"source_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "voting_sessions_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "politicians" ADD CONSTRAINT "politicians_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweet_vote_associations" ADD CONSTRAINT "tweet_vote_associations_tweet_id_tweets_id_fk" FOREIGN KEY ("tweet_id") REFERENCES "public"."tweets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweet_vote_associations" ADD CONSTRAINT "tweet_vote_associations_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweets" ADD CONSTRAINT "tweets_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweets" ADD CONSTRAINT "tweets_related_session_id_voting_sessions_id_fk" FOREIGN KEY ("related_session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_session_id_voting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "party_name_idx" ON "parties" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "party_short_name_idx" ON "parties" USING btree ("short_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "politician_name_idx" ON "politicians" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "politician_twitter_idx" ON "politicians" USING btree ("twitter_handle");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "politician_party_idx" ON "politicians" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_log_type_idx" ON "system_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_log_status_idx" ON "system_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_log_created_at_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tweet_vote_assoc_tweet_idx" ON "tweet_vote_associations" USING btree ("tweet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tweet_vote_assoc_vote_idx" ON "tweet_vote_associations" USING btree ("vote_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tweet_politician_idx" ON "tweets" USING btree ("politician_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tweet_posted_at_idx" ON "tweets" USING btree ("posted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tweet_external_id_idx" ON "tweets" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tweet_related_session_idx" ON "tweets" USING btree ("related_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_session_idx" ON "votes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_politician_idx" ON "votes" USING btree ("politician_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_type_idx" ON "votes" USING btree ("vote");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vote_unique_idx" ON "votes" USING btree ("politician_id","session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voting_session_date_idx" ON "voting_sessions" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "voting_session_external_id_idx" ON "voting_sessions" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voting_session_category_idx" ON "voting_sessions" USING btree ("category");