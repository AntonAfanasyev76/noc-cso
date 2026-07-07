import { Component, inject, signal } from '@angular/core';
import { Header } from '../../header/header';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SZOApiService } from '../../services/szo-api.service';
import { ToastrService } from 'ngx-toastr';
import { SZO } from '../../models/szo.model';

@Component({
  selector: 'app-find-szo',
  imports: [Header, FormsModule, CommonModule],
  templateUrl: './find-szo.html',
  styleUrl: './find-szo.css',
})
export class FindSzo {
  szoNumber: string = '';
  szoData: SZO | null = null;
  isLoading = signal(false);
  isEditing = signal(false);
  tempStatus = false;
  tempNote = '';

  toastr = inject(ToastrService);

  constructor(private szoApi: SZOApiService) {}

  // Поиск СЗО по номеру
  findSzo(): void {
    const rawValue = this.szoNumber.trim();

    if (!rawValue) {
      this.toastr.error('Введите номер СЗО');
      return;
    }

    this.isLoading.set(true);
    this.szoData = null;
    this.isEditing.set(false);

    this.szoApi.getSZOByNumber(rawValue).subscribe((response) => {
      this.isLoading.set(false);

      if (!response) {
        this.toastr.error(`СЗО с номером "${rawValue}" не найдено`);
        this.szoData = null;
        return;
      }

      this.toastr.success('СЗО найдено!');
      this.szoData = response;
      this.tempStatus = response.hasProblem;
      this.tempNote = response.note || '';
    });
  }

  // Начать редактирование
  startEdit(): void {
    this.isEditing.set(true);
  }

  // Отменить редактирование
  cancelEdit(): void {
    this.isEditing.set(false);
    if (this.szoData) {
      this.tempStatus = this.szoData.hasProblem;
      this.tempNote = this.szoData.note || '';
    }
  }

  // Сохранить изменения
  saveChanges(): void {
    if (!this.szoData) return;

    this.isLoading.set(true);

    this.szoApi.updateSZOStatus(
      this.szoData.number,
      this.tempStatus,
      this.tempNote
    ).subscribe((response) => {
      this.isLoading.set(false);

      if (!response) {
        this.toastr.error('Ошибка при обновлении статуса');
        return;
      }

      this.toastr.success('Статус СЗО успешно обновлен!');
      this.szoData = response;
      this.isEditing.set(false);
    });
  }

  // Форматирование даты
  formatDate(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Получить CSS класс для статуса
  getStatusClass(hasProblem: boolean): string {
    return hasProblem ? 'status-problem' : 'status-ok';
  }

  // Получить текст статуса
  getStatusText(hasProblem: boolean): string {
    return hasProblem ? '⚠️ Есть проблема' : '✅ Нет проблем';
  }
}
