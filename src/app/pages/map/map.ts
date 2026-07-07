import { Component, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Header } from '../../header/header';
import { CommonModule } from '@angular/common';
import { SZOApiService } from '../../services/szo-api.service';
import { SZO } from '../../models/szo.model';
import { ToastrService } from 'ngx-toastr';

declare var ymaps: any;

@Component({
  selector: 'app-map',
  imports: [Header, CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map: any;
  private placemarks: any[] = [];
  private clusterer: any;
  
  isLoading = signal(true);
  problematicSZO: SZO[] = [];
  selectedSZO: SZO | null = null;
  
  toastr = inject(ToastrService);

  constructor(private szoApi: SZOApiService) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);
    
    this.szoApi.getProblematicSZO().subscribe((data: SZO[]) => {
      this.problematicSZO = data;
      this.isLoading.set(false);
      
      if (this.problematicSZO.length === 0) {
        this.toastr.info('Проблемных СЗО не найдено');
      }
      
      this.initMap();
    });
  }

  private initMap() {
    ymaps.ready(() => {
      this.map = new ymaps.Map(this.mapContainer.nativeElement, {
        center: [55.751244, 37.618423],
        zoom: 5,
        controls: ['zoomControl', 'fullscreenControl']
      });

      // Создаем кластеризатор для группировки маркеров
      this.clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: false,
        clusterOpenBalloonOnClick: false,
        gridSize: 32,
        clusterIconColor: '#FF6B6B',
        clusterIcons: [{
          href: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iI0ZGNkI2QiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmIj4lY291bnQlPC90ZXh0Pjwvc3ZnPg==',
          size: [40, 40],
          offset: [-20, -20]
        }]
      });

      // Добавляем маркеры для каждого проблемного СЗО
      this.problematicSZO.forEach((szo) => {
        if (szo.latitude && szo.longitude) {
          const placemark = this.createPlacemark(szo);
          this.placemarks.push(placemark);
        }
      });

      // Добавляем все маркеры в кластеризатор
      if (this.placemarks.length > 0) {
        this.clusterer.add(this.placemarks);
        this.map.geoObjects.add(this.clusterer);
        
        // Если есть маркеры, центрируем карту на них
        if (this.placemarks.length === 1) {
          const coords = [this.problematicSZO[0].latitude, this.problematicSZO[0].longitude];
          this.map.setCenter(coords, 12);
        } else {
          // Или показываем все маркеры
          this.map.setBounds(this.clusterer.getBounds(), {
            checkZoomRange: true
          });
        }
      }
    });
  }

  private createPlacemark(szo: SZO): any {
    const coords = [szo.latitude, szo.longitude];
    
    // Содержимое балуна (при клике)
    const balloonContent = `
      <div style="padding: 12px; max-width: 300px;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #E03131;">
          ⚠️ Проблема
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Номер СЗО:</strong> ${szo.number}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Адрес:</strong> ${szo.address}
        </div>
        ${szo.note ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E8E8E7;">
            <strong>📝 Примечание:</strong>
            <div style="margin-top: 4px; color: #555;">${szo.note}</div>
          </div>
        ` : ''}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E8E8E7; font-size: 12px; color: #999;">
          Обновлено: ${this.formatDate(szo.updatedAt)}
        </div>
      </div>
    `;

    // Содержимое хинта (при наведении)
    const hintContent = `
      <div style="padding: 8px;">
        <strong>${szo.number}</strong>
        ${szo.note ? `<br><span style="font-size: 12px; color: #666;">${szo.note.substring(0, 50)}${szo.note.length > 50 ? '...' : ''}</span>` : ''}
      </div>
    `;

    // Создаем красный маркер для проблемных объектов
    const placemark = new ymaps.Placemark(coords, {
      balloonContent: balloonContent,
      hintContent: hintContent
    }, {
      preset: 'islands#redIcon',
      iconColor: '#FF6B6B'
    });

    // Обработчик клика по маркеру
    placemark.events.add('click', () => {
      this.selectedSZO = szo;
    });

    return placemark;
  }

  // Метод formatDate - публичный, чтобы был доступен в шаблоне
  public formatDate(dateString: string): string {
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

  // Центрировать карту на выбранном СЗО
  centerOnSZO(szo: SZO): void {
    if (szo.latitude && szo.longitude) {
      this.map.setCenter([szo.latitude, szo.longitude], 14, {
        duration: 500
      });
      this.selectedSZO = szo;
      
      // Открываем балун маркера
      this.placemarks.forEach((placemark) => {
        const coords = placemark.geometry.getCoordinates();
        if (coords[0] === szo.latitude && coords[1] === szo.longitude) {
          placemark.balloon.open();
        }
      });
    }
  }
}
