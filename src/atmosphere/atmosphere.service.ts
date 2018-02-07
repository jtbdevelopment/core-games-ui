import {PlayerService} from '../player/player.service';
import {Player} from '../player/player.model';
import {Injectable} from '@angular/core';
import * as atmosphere from 'atmosphere.js';
import {AtmosphereMessageProcessorService} from './atmosphere-message-processor.service';
import {AtmosphereRequest} from './atmosphere-request.model';

@Injectable()
export class AtmosphereService {
  endPoint = '';

  //  TODO - public to aid in testing, global var blocked
  socket = atmosphere;

  private currentPlayerId: string;
  private currentConnection: any;

  constructor(private playerService: PlayerService, private messageHandler: AtmosphereMessageProcessorService) {
    playerService.player.subscribe(player => {
      this.startSocket(player);
    });
  }

  private closeSocket(): void {
    if (this.currentConnection) {
      try {
        this.currentConnection.close();
      } catch (error) {
        console.log('error closing existing live feed ' + JSON.stringify(error));
      }
      this.currentConnection = null;
    }
    this.currentPlayerId = null;
  }

  private startSocket(player: Player): void {
    if (player && player.id && player.id !== this.currentPlayerId) {
      this.closeSocket();

      const currentRequest: AtmosphereRequest = new AtmosphereRequest(this.endPoint, player.id);
      this.messageHandler.listen(currentRequest);
      try {
        this.currentConnection = this.socket.subscribe(currentRequest);
        this.currentPlayerId = player.id;
      } catch (error) {
        console.log('error with live feed ' + JSON.stringify(error));
      }
    } else if (!player || !player.id) {
      this.closeSocket();
    }
  }
}

