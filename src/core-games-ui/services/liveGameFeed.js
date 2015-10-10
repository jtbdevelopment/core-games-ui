/*global atmosphere:false */
'use strict';
angular.module('coreGamesUi.services').factory('jtbLiveGameFeed',
    ['$rootScope', 'jtbPlayerService', '$timeout',
        function ($rootScope, jtbPlayerService, $timeout) {
            var pendingSubscribe;
            var endpoint = '';

            var request = {
                url: '',
                contentType: 'application/json',
                logLevel: 'info',
                //  AWS doesn't support so kind of pointless and slow to default to it
                //transport: 'websocket',
                transport: 'long-polling',
                trackMessageLength: true,
                fallbackTransport: 'long-polling',
                withCredentials: true,
                handleOnlineOffline: false,
                closeAsync: true,  // needed because of withCredentials true

                onOpen: function (response) {
                    $timeout(function () {
                        console.info(this.url + ' Atmosphere connected using ' + response.transport);
                        $rootScope.$broadcast('liveFeedEstablished');
                    });
                },

                onMessage: function (response) {
                    $timeout(function () {
                        if (angular.isDefined(response.messages)) {
                            response.messages.forEach(function (messageString) {
                                var message;
                                try {
                                    message = JSON.parse(messageString);
                                } catch (error) {
                                    console.error('got non-parseable message');
                                    return;
                                }

                                if (angular.isDefined(message.messageType)) {
                                    switch (message.messageType.toString()) {
                                        //  TODO - Handle Alert
                                        case 'Game':
                                            $rootScope.$broadcast('gameUpdate', message.game.id, message.game);
                                            return;
                                        case 'Heartbeat':
                                            console.info('got a heartbeat ' + JSON.stringify(message.message));
                                            return;
                                        case 'Player':
                                            $rootScope.$broadcast('playerUpdate', message.player.id, message.player);
                                            return;
                                        default:
                                            console.warn('onMessage: unknown message type \'' +
                                                message.messageType +
                                                '\'');
                                            break;
                                    }
                                    console.warn('onMessage: unknown message type \'' + message.messageType + '\'');
                                }
                                console.warn('unknown message structure ' + message);
                            });
                        } else {
                            console.warn(this.url + ' unknown onMessage: ' + JSON.stringify(response));
                        }
                    });
                },

                onClose: function (response) {
                    $timeout(function () {
                        //  TODO
                        console.warn(this.url + ' closed: ' + JSON.stringify(response));
                    });
                },

                onError: function (response) {
                    $timeout(function () {
                        //  TODO
                        console.error(this.url + ' onError: ' + JSON.stringify(response));
                    });
                }
            };

            var socket = atmosphere;
            var subscribed;

            function unsubscribe() {
                if (angular.isDefined(pendingSubscribe)) {
                    $timeout.cancel(pendingSubscribe);
                    pendingSubscribe = undefined;
                }
                if (angular.isDefined(subscribed)) {
                    console.log('ending livefeedsubcription to ' + jtbPlayerService.currentID());
                    subscribed.close();
                }
                subscribed = undefined;
            }

            function subscribeToCurrentPlayer(depth) {
                unsubscribe();
                if (angular.isUndefined(depth)) {
                    depth = 0;
                }
                pendingSubscribe = $timeout(function () {
                    if (jtbPlayerService.currentID() !== '') {
                        request.url = endpoint + '/livefeed/' + jtbPlayerService.currentID();
                        try {
                            subscribed = socket.subscribe(request);
                        } catch (ex) {
                            console.log(JSON.stringify(ex));
                            if (depth < 5) {
                                pendingSubscribe = $timeout(function () {
                                    subscribeToCurrentPlayer(depth + 1);
                                }, 500);
                            } else {
                                //  TODO
                                console.warn('Gave up trying to subscribe to websocket');
                            }
                        }
                    }
                }, 1000);
            }

            $rootScope.$on('playerLoaded', function () {
                subscribeToCurrentPlayer();
            });

            if (jtbPlayerService.currentID() !== '') {
                subscribeToCurrentPlayer();
            }

            return {
                suspendFeed: function () {
                    unsubscribe();
                },
                setEndPoint: function (newEndpoint) {
                    endpoint = newEndpoint;
                },
                handler: function () {
                    return request;
                }
            };
        }

    ]
);
