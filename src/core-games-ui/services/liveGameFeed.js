/*global $:false */
'use strict';
angular.module('coreGamesUi.services').factory('jtbLiveGameFeed',
    ['$rootScope', 'jtbPlayerService',
        function ($rootScope, jtbPlayerService) {
            var request = {
                url: '',
                contentType: 'application/json',
                logLevel: 'debug',
                //  AWS doesn't support so kind of pointless and slow to default to it
                //transport: 'websocket',
                transport: 'long-polling',
                trackMessageLength: true,
                fallbackTransport: 'long-polling',

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

            function subscribeToCurrentPlayer() {
                if (angular.isDefined(subscribed)) {
                    subscribed.close();
                }
                request.url = '/livefeed/' + jtbPlayerService.currentID();
                subscribed = socket.subscribe(request);
            }

            $rootScope.$on('playerLoaded', function () {
                subscribeToCurrentPlayer();
            });

            if(jtbPlayerService.currentID() != '') {
                subscribeToCurrentPlayer();
            }

            return {
                handler: function () {
                    return request;
                }
            };
        }

    ]
);
