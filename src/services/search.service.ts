import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private terminoSource = new BehaviorSubject<string>('');
  termino$ = this.terminoSource.asObservable();

  setTermino(termino: string) {
    this.terminoSource.next(termino);
  }
}


