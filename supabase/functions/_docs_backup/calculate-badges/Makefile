# Makefile for calculate-badges Edge Function
# Provides convenient shortcuts for common tasks

.PHONY: help deploy deploy-local test test-local logs seed migrate setup-cron clean

# Default target - show help
help:
	@echo "Calculate Badges - Edge Function Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make deploy         - Deploy function to production"
	@echo "  make deploy-local   - Deploy to local Supabase"
	@echo "  make test           - Run tests"
	@echo "  make test-local     - Test function locally with curl"
	@echo "  make logs           - View function logs"
	@echo "  make logs-follow    - Stream function logs in real-time"
	@echo "  make seed           - Seed badges to database"
	@echo "  make migrate        - Run database migration"
	@echo "  make setup-cron     - Set up cron job (edit SQL first!)"
	@echo "  make clean          - Clean temporary files"
	@echo "  make status         - Show function and cron status"
	@echo ""

# Deploy to production
deploy:
	@echo "Deploying calculate-badges to production..."
	supabase functions deploy calculate-badges
	@echo "Deployment complete!"
	@echo "Test with: make test-prod"

# Deploy to local
deploy-local:
	@echo "Starting local Supabase..."
	supabase start
	@echo "Deploying calculate-badges locally..."
	supabase functions deploy calculate-badges --local
	@echo "Local deployment complete!"

# Run tests
test:
	@echo "Running tests..."
	deno test --allow-env --allow-net index.test.ts

# Test locally with curl
test-local:
	@echo "Testing function locally..."
	./test-local.sh

# Test production
test-prod:
	@echo "Testing production function..."
	@echo "Enter your project ref:"
	@read PROJECT_REF; \
	echo "Enter your anon key:"; \
	read ANON_KEY; \
	curl -i --location --request POST \
	  "https://$$PROJECT_REF.supabase.co/functions/v1/calculate-badges" \
	  --header "Authorization: Bearer $$ANON_KEY" \
	  --header "Content-Type: application/json"

# View logs
logs:
	@echo "Viewing function logs..."
	supabase functions logs calculate-badges --limit 50

# Stream logs
logs-follow:
	@echo "Streaming function logs (Ctrl+C to stop)..."
	supabase functions logs calculate-badges --follow

# Seed badges
seed:
	@echo "Seeding badges..."
	@echo "⚠️  Make sure you've edited seed-badges.sql with your tenant_id!"
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		supabase db execute --file seed-badges.sql; \
		echo "Badges seeded successfully!"; \
	else \
		echo "Cancelled."; \
	fi

# Run migration
migrate:
	@echo "Running database migration..."
	supabase db execute --file migration-add-badge-slug.sql
	@echo "Migration complete!"

# Set up cron job
setup-cron:
	@echo "Setting up cron job..."
	@echo "⚠️  Make sure you've edited setup-cron.sql with your project details!"
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		supabase db execute --file setup-cron.sql; \
		echo "Cron job set up successfully!"; \
	else \
		echo "Cancelled."; \
	fi

# Check status
status:
	@echo "Function Status:"
	@echo "================"
	@supabase functions list | grep calculate-badges || echo "Function not deployed"
	@echo ""
	@echo "Cron Job Status:"
	@echo "================"
	@supabase db execute --query "SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE '%calculate-badges%';" || echo "No cron job found"
	@echo ""
	@echo "Recent Badge Awards:"
	@echo "===================="
	@supabase db execute --query "SELECT COUNT(*) as total_badges FROM user_badges;" || echo "Cannot query database"

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	@rm -f *.log
	@echo "Clean complete!"

# Full setup (all steps)
setup: migrate seed deploy setup-cron
	@echo ""
	@echo "✅ Full setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Test the function: make test-prod"
	@echo "2. Monitor logs: make logs-follow"
	@echo "3. Check status: make status"
