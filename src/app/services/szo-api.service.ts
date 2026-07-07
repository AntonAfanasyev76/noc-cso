import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SZO } from '../models/szo.model';

@Injectable({
  providedIn: 'root',
})
export class SZOApiService {
  private mockSZOList: SZO[] = [
    {
      id: 1,
      number: 'SZO-001',
      address: 'Москва, ул. Тверская, 1',
      hasProblem: true,
      note: 'Не работает датчик движения, требуется замена',
      createdAt: '2024-01-20T10:00:00',
      updatedAt: '2024-01-20T10:00:00',
      latitude: 55.7558,
      longitude: 37.6173
    },
    {
      id: 2,
      number: 'SZO-002',
      address: 'Санкт-Петербург, Невский пр., 100',
      hasProblem: false,
      note: 'Работает в штатном режиме',
      createdAt: '2024-01-21T08:30:00',
      updatedAt: '2024-01-21T08:30:00',
      latitude: 59.9343,
      longitude: 30.3351
    },
    {
      id: 3,
      number: 'SZO-003',
      address: 'Казань, ул. Баумана, 15',
      hasProblem: true,
      note: 'Сработала ложная тревога, требуется проверка',
      createdAt: '2024-01-22T14:00:00',
      updatedAt: '2024-01-22T14:00:00',
      latitude: 55.7963,
      longitude: 49.1088
    }
  ];

  // Создание нового СЗО
  createSZO(szoData: Omit<SZO, 'id' | 'createdAt' | 'updatedAt'>): Observable<SZO> {
    console.log('Создание СЗО:', szoData);
    
    const newSZO: SZO = {
      ...szoData,
      id: Math.floor(Math.random() * 1000) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.mockSZOList.push(newSZO);
    return of(newSZO);
  }

  // Получение СЗО по номеру
  getSZOByNumber(number: string): Observable<SZO | null> {
    console.log(`Поиск СЗО по номеру: ${number}`);
    const found = this.mockSZOList.find(szo => szo.number === number);
    return of(found || null);
  }

  // Получение всех проблемных СЗО
  getProblematicSZO(): Observable<SZO[]> {
    console.log('Получение всех проблемных СЗО');
    const problematic = this.mockSZOList.filter(szo => szo.hasProblem);
    return of(problematic);
  }

  // Обновление статуса СЗО
  updateSZOStatus(number: string, hasProblem: boolean, note?: string): Observable<SZO | null> {
    console.log(`Обновление статуса СЗО ${number} на ${hasProblem}`);
    const found = this.mockSZOList.find(szo => szo.number === number);
    if (found) {
      found.hasProblem = hasProblem;
      if (note !== undefined) {
        found.note = note;
      }
      found.updatedAt = new Date().toISOString();
    }
    return of(found || null);
  }

  // Получение всех СЗО (для карты)
  getAllSZO(): Observable<SZO[]> {
    console.log('Получение всех СЗО');
    return of(this.mockSZOList);
  }
}
