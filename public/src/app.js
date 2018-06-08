angular.module('beacon-dashboard', ['ui.bootstrap', 'btford.socket-io'])
.factory("socket", ['socketFactory', function(socketFactory) {
    var connection = io.connect(prompt("Server address", "http://localhost:8000"));
    return socketFactory(connection);
}]).controller('beaconCtrl', ['$scope', 'socket', function($scope, socket) {
    $scope.loaded = false;
    $scope.beacons = [];

    socket.on('update', function(data) {
        $scope.beacons = [];
        for (var i in data) {
            if (!data.hasOwnProperty(i))
                continue;
            $scope.beacons.push({
                name: i,
                state: data[i].status,
                ts: (Date.now() - data[i].last_update * 1000)
            });
        }
    })
}])