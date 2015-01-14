var subScnls={};

// Redis configuration
subScnls.key = "hawks3Z";
subScnls.redisHost = "products01.ess.washington.edu";
subScnls.redisPort = 32109;
subScnls.port = 8080;

// Azure configuration
subScnls.AzureEndpoint  = "Endpoint=...";
subScnls.AzureTopic     = 'quickshake';
subScnls.AzureSub       = 'shaker';

module.exports = subScnls;
