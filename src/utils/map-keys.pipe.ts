// from https://webcake.co/looping-over-maps-and-sets-in-angular-2s-ngfor/
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'mapKeys'})
export class MapKeysPipe implements PipeTransform {
  transform(value: any, args: any[] = null): any {
    return Object.keys(value).map(key => key);
  }
}
