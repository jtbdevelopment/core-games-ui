/*global $:false */
'use strict';
angular.module('coreGamesUi.services').factory('jtbLiveGameFeed',
    ['$rootScope', 'jtbPlayerService', '$timeout',
        function ($rootScope, jtbPlayerService, $timeout) {
            var pendingSubscribe;
            var endpoint = '';

            var request = {
                url: '',
                contentType: 'application/json',
                logLevel: 'debug',
                //  AWS doesn't support so kind of pointless and slow to default to it
                //transport: 'websocket',
                transport: 'long-polling',
                trackMessageLength: true,
                fallbackTransport: 'long-polling',
                withCredentials: true,

                onOpen: function (response) {
                    console.info(this.url + ' Atmosphere connected using ' + response.transport);
                    $rootScope.$broadcast('liveFeedEstablished');
                },

                onMessage: function (response) {
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
                                        console.warn('onMessage: unknown message type \'' + message.messageType + '\'');
                                        break;
                                }
                                console.warn('onMessage: unknown message type \'' + message.messageType + '\'');
                            }
                            console.warn('unknown message structure ' + message);
                        });
                    } else {
                        console.warn(this.url + ' unknown onMessage: ' + JSON.stringify(response));
                    }
                },

                onClose: function (response) {
                    console.warn(this.url + ' closed: ' + JSON.stringify(response));
                },

                onError: function (response) {
                    console.error(this.url + ' onError: ' + JSON.stringify(response));
                }
            };

            var socket = $.atmosphere;
            var subscribed;

            function unssubscribe() {
                if(angular.isDefined(pendingSubscribe)) {
                    $timeout.cancel(pendingSubscribe);
                    pendingSubscribe = undefined;
                }
                if (angular.isDefined(subscribed)) {
                    console.log('ending livefeedsubcription to ' + jtbPlayerService.currentID());
                    subscribed.close();
                }
                subscribed = undefined;
            }

            function subscribeToCurrentPlayer() {
                unssubscribe();
                pendingSubscribe = $timeout(function() {
                    if(jtbPlayerService.currentID() !== '') {
                        request.url = endpoint + '/livefeed/' + jtbPlayerService.currentID();
                        try {
                            subscribed = socket.subscribe(request);
                        } catch(ex) {
                            console.log(JSON.stringify(ex));
                            pendingSubscribe = $timeout(function() {
                                subscribed = socket.subscribe(request);
                            }, 1000);
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
                suspendFeed: function() {
                    unssubscribe();
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
