export interface SZO {
  id: number;
  number: string;        // Номер СЗО
  address: string;       // Адрес
  hasProblem: boolean;   // Есть ли проблема
  note: string;          // Примечание (дополнительная информация)
  createdAt: string;     // Дата создания
  updatedAt: string;     // Дата обновления
  latitude?: number;     // Координаты для карты
  longitude?: number;
}

export interface SZOStatus {
  number: string;
  hasProblem: boolean;
  address: string;
  note: string;
}
