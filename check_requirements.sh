#!/bin/bash

LOG_FILE="./check_requirements.log"
SECRETS_JSON="./security/init_vault/tools/secrets.json"
REQUIREMENTS_JSON="./security/init_vault/tools/requirements.json"
# Function to check a single service
check_requirements() {
    local service="$1"
    echo "🔍 Checking service: $service" | tee -a "$LOG_FILE"

    # Retrieve required variables for the service
    local required_vars=$(jq -r ".services[\"$service\"][]" $REQUIREMENTS_JSON 2>/dev/null)
    if [[ -z "$required_vars" || "$required_vars" == "null" ]]; then
        echo "⚠️  Service '$service' not found or no required variables defined." | tee -a "$LOG_FILE"
        return 1
    fi

    local missing=0
    for var in $required_vars; do
        value=$(jq -r ".services[\"$service\"].\"$var\"" $SECRETS_JSON 2>/dev/null)
        if [[ -z "$value" || "$value" == "null" ]]; then
            echo "❌ Missing variable $var for service $service" | tee -a "$LOG_FILE"
            missing=1
        else
            echo "✅ $var is set" | tee -a "$LOG_FILE"
        fi
    done

    return $missing
}

# Function to check all services
check_all_services() {
    echo "🚀 Starting service validation..." | tee "$LOG_FILE"

    # Ensure JSON files exist
    if [[ ! -f "$REQUIREMENTS_JSON" || ! -f "$SECRETS_JSON" ]]; then
        echo "❌ Missing $REQUIREMENTS_JSON or $SECRETS_JSON." | tee -a "$LOG_FILE"
        exit 1
    fi

    local all_services=$(jq -r '.services | keys[]' $REQUIREMENTS_JSON)
    local total_errors=0

    for service in $all_services; do
        check_requirements "$service"
        if [[ $? -ne 0 ]]; then
            total_errors=$((total_errors + 1))
        fi
        echo "" | tee -a "$LOG_FILE"
    done

    # Final summary
    echo "🎯 Final Summary:" | tee -a "$LOG_FILE"
    if [[ $total_errors -gt 0 ]]; then
        echo "❌ $total_errors service(s) have missing variables." | tee -a "$LOG_FILE"
        echo "📄 Check the log file: $LOG_FILE" | tee -a "$LOG_FILE"
        exit 1 # Exit with error if any service is missing variables
    else
        echo "✅ All requirements have been set !" | tee -a "$LOG_FILE"
        exit 0
    fi
}

# Auto-run validation for all services
check_all_services
