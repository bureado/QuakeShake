var client = new WindowsAzure.MobileServiceClient('https://shakemobile.azure-mobile.net/', 'uyCWYRPbvrXUJlvtjZGnoKLLSbVaAq20'),
ShakeTable = client.getTable('quickshake');

var refreshInterval = 15000;
var notificationAge = 30000;

var displayed = {};

function handleError(error) {
    var text = error + (error.request ? ' - ' + error.request.status : '');
    console.log(text);
}

function refreshShake() {
    var query = ShakeTable.where({});
    var qtime = new Date();
    query.read().then(function(todoItems) {
        var listItems = $.map(todoItems, function(item) {
		if (!displayed[item.id] && item.stime && item.show) {
		        if ( qtime.valueOf() < item.stime + notificationAge ) {
				console.log(item.text);
		  		alert(item.text);
				displayed[item.id] = item.text;
			}
		} else {
			console.log(item);
		}
	});
    }, handleError);
}

setInterval("refreshShake()", refreshInterval);
