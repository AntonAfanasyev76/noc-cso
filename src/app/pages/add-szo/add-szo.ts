import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Header } from '../../header/header';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SZOApiService } from '../../services/szo-api.service';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';

declare var ymaps: any;

@Component({
  selector: 'app-add-szo',
  imports: [Header, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './add-szo.html',
  styleUrl: './add-szo.css',
})
export class AddSzo implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  toastr = inject(ToastrService);
  
  public szoForm: FormGroup;
  public map: any;
  public placemark: any;
  public szoId: any = signal(null);
  public isSubmitting = signal(false);

  // Список статусов для селектора
  public statusOptions = [
    { value: false, label: '✅ Нет проблем' },
    { value: true, label: '⚠️ Есть проблема' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private szoApi: SZOApiService
  ) {
    this.szoForm = this.formBuilder.group({
      number: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      hasProblem: [false, Validators.required],
      note: ['']
    });
  }

  ngOnInit() {
    this.initMap();
    
    // Следим за изменением адреса для обновления карты
    this.szoForm.get('address')?.valueChanges.subscribe((address) => {
      if (address && address.length > 5) {
        this.searchAddress(address);
      }
    });
  }

  private initMap() {
    ymaps.ready(() => {
      this.map = new ymaps.Map(this.mapContainer.nativeElement, {
        center: [55.751244, 37.618423],
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl']
      });

      // Добавляем обработчик клика по карте для выбора адреса
      this.map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        this.getAddressByCoords(coords);
      });
    });
  }

  private searchAddress(query: string) {
    if (!this.map) return;

    ymaps.geocode(query, {
      results: 1
    }).then((res: any) => {
      const firstGeoObject = res.geoObjects.get(0);
      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();
        this.map.setCenter(coords, 12);
        this.addPlacemark(coords, query);
      }
    });
  }

  private getAddressByCoords(coords: number[]) {
    ymaps.geocode(coords).then((res: any) => {
      const firstGeoObject = res.geoObjects.get(0);
      if (firstGeoObject) {
        const address = firstGeoObject.getAddressLine();
        this.szoForm.patchValue({ address });
        this.addPlacemark(coords, address);
      }
    });
  }

  private addPlacemark(coords: number[], address: string) {
    if (this.placemark) {
      this.map.geoObjects.remove(this.placemark);
    }

    // Создаем метку с информацией
    this.placemark = new ymaps.Placemark(coords, {
      balloonContent: `
        <div style="padding: 10px;">
          <strong>Адрес:</strong> ${address}<br>
          <strong>Статус:</strong> ${this.szoForm.get('hasProblem')?.value ? '⚠️ Проблема' : '✅ Нет проблем'}<br>
          ${this.szoForm.get('note')?.value ? `<strong>Примечание:</strong> ${this.szoForm.get('note')?.value}` : ''}
        </div>
      `,
      hintContent: address
    }, {
      preset: this.szoForm.get('hasProblem')?.value ? 'islands#redIcon' : 'islands#greenIcon',
      draggable: true
    });

    this.map.geoObjects.add(this.placemark);

    // Обновляем метку при изменении статуса
    this.szoForm.get('hasProblem')?.valueChanges.subscribe((hasProblem) => {
      if (this.placemark) {
        this.placemark.options.set('preset', hasProblem ? 'islands#redIcon' : 'islands#greenIcon');
        // Обновляем balloon
        this.placemark.properties.set('balloonContent', `
          <div style="padding: 10px;">
            <strong>Адрес:</strong> ${this.szoForm.get('address')?.value}<br>
            <strong>Статус:</strong> ${hasProblem ? '⚠️ Проблема' : '✅ Нет проблем'}<br>
            ${this.szoForm.get('note')?.value ? `<strong>Примечание:</strong> ${this.szoForm.get('note')?.value}` : ''}
          </div>
        `);
      }
    });

    // Обновляем метку при изменении примечания
    this.szoForm.get('note')?.valueChanges.subscribe((note) => {
      if (this.placemark) {
        const hasProblem = this.szoForm.get('hasProblem')?.value;
        this.placemark.properties.set('balloonContent', `
          <div style="padding: 10px;">
            <strong>Адрес:</strong> ${this.szoForm.get('address')?.value}<br>
            <strong>Статус:</strong> ${hasProblem ? '⚠️ Проблема' : '✅ Нет проблем'}<br>
            ${note ? `<strong>Примечание:</strong> ${note}` : ''}
          </div>
        `);
      }
    });
  }

  public onSubmit() {
    if (this.szoForm.invalid) {
      this.toastr.error('Заполните все обязательные поля');
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.szoForm.value;
    
    // Получаем координаты, если есть метка
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (this.placemark) {
      const coords = this.placemark.geometry.getCoordinates();
      latitude = coords[0];
      longitude = coords[1];
    }

    const szoData = {
      number: formValue.number,
      address: formValue.address,
      hasProblem: formValue.hasProblem,
      note: formValue.note || '',
      latitude,
      longitude
    };

    this.szoApi.createSZO(szoData).subscribe((response: any) => {
      this.isSubmitting.set(false);
      
      if ('error' in response) {
        this.toastr.error(response.error as string);
        return;
      }

      this.toastr.success('СЗО успешно добавлено!');
      this.szoId.set(response.id);
      this.szoForm.reset({
        hasProblem: false
      });
      
      // Очищаем метку с карты
      if (this.placemark) {
        this.map.geoObjects.remove(this.placemark);
        this.placemark = null;
      }
    });
  }

  public clearMap() {
    if (this.placemark) {
      this.map.geoObjects.remove(this.placemark);
      this.placemark = null;
    }
    this.szoForm.patchValue({ address: '' });
  }
}
