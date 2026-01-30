import { Component, ElementRef, OnInit, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleService } from '../../services/schedule.service';
import { WorkCenterDocument, WorkOrderDocument } from '../../models/work-order.model';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CreateEditPanelComponent } from '../create-edit-panel/create-edit-panel.component';

type ZoomLevel = 'hour' | 'day' | 'week' | 'month';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, CreateEditPanelComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  workCenters: WorkCenterDocument[] = [];
  workOrders: WorkOrderDocument[] = [];

  // Panel State
  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  selectedOrder: WorkOrderDocument | null = null;
  clickedDate: Date | null = null;

  zoomLevel: ZoomLevel = 'day';
  zoomOptions = [
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ];

  // Helper variables for measuring dates
  today: Date = new Date();
  startDate: Date = new Date();
  endDate: Date = new Date();

  dates: Date[] = []; // Represents columns (Days OR Hours)

  // Drag to Scroll State
  isDragging = false;
  startX = 0;
  scrollLeft = 0;

  // Drag to Scroll State
  // isDragging = false;
  // startX = 0;
  // scrollLeft = 0;

  // Hover State for Phantom Bar
  hoveredCenterId: string | null = null;
  hoveredDate: Date | null = null;
  hoveredLeft: string = '0px';

  constructor(private scheduleService: ScheduleService) { }

  ngOnInit(): void {
    this.scheduleService.workCenters$.subscribe(centers => this.workCenters = centers);
    this.scheduleService.workOrders$.subscribe(orders => this.workOrders = orders);
    this.updateTimelineRange();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure render
    setTimeout(() => this.scrollToToday(), 100);
    this.initDragToScroll();
  }

  initDragToScroll() {
    const slider = this.scrollContainer.nativeElement as HTMLElement;

    slider.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      slider.classList.add('active'); // Optional: for styling cursor
      this.startX = e.pageX - slider.offsetLeft;
      this.scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      this.isDragging = false;
      slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
      this.isDragging = false;
      slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - this.startX) * 1.5; // Scroll-fast multiplier
      slider.scrollLeft = this.scrollLeft - walk;
    });
  }

  onZoomChange() {
    this.updateTimelineRange();
    setTimeout(() => this.scrollToToday(), 0);
  }

  scrollToToday() {
    if (!this.scrollContainer) return;

    const el = this.scrollContainer.nativeElement as HTMLElement;
    const today = new Date();

    const msFromStart = today.getTime() - this.startDate.getTime();
    const pxPerMs = this.getPxPerMs();
    const todayPos = msFromStart * pxPerMs;

    // Center logic: Position - Half Viewport Width
    // If user says "too far right", maybe they prefer Today be more to the left?
    // Let's bias it to 30% of screen instead of 50%?
    // For now, I'll stick to true center but ensure offsets are correct.

    const center = todayPos - (el.clientWidth / 2);

    el.scrollTo({ left: center, behavior: 'smooth' });
  }

  updateTimelineRange() {
    const now = new Date();

    if (this.zoomLevel === 'hour') {
      // Hour View: Show +/- 24 hours
      // Align to start of current hour
      now.setMinutes(0, 0, 0);

      const start = new Date(now);
      start.setHours(now.getHours() - 24);

      const end = new Date(now);
      end.setHours(now.getHours() + 24);

      this.startDate = start;
      this.endDate = end;
    } else {
      // Day/Week/Month: Align to start of day
      now.setHours(0, 0, 0, 0);

      let startOffset = 0;
      let endOffset = 0;

      if (this.zoomLevel === 'day') {
        startOffset = -14;
        endOffset = 14;
      } else if (this.zoomLevel === 'week') {
        startOffset = -60;
        endOffset = 60;
      } else { // month
        startOffset = -180;
        endOffset = 180;
      }

      const start = new Date(now);
      start.setDate(now.getDate() + startOffset);
      this.startDate = start;

      const end = new Date(now);
      end.setDate(now.getDate() + endOffset);
      this.endDate = end;
    }

    this.generateDates();
  }

  generateDates() {
    this.dates = [];
    const current = new Date(this.startDate);

    // Safety break to prevent infinite loops
    let loops = 0;
    while (current <= this.endDate && loops < 1000) {
      this.dates.push(new Date(current));

      if (this.zoomLevel === 'hour') {
        current.setHours(current.getHours() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
      loops++;
    }
  }

  // Formatting for header
  getDateLabel(date: Date): string {
    if (this.zoomLevel === 'hour') {
      return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    }

    if (this.zoomLevel === 'day') {
      return date.getDate().toString();
    } else if (this.zoomLevel === 'week') {
      // Show only mondays
      if (date.getDay() === 1) return `Wk ${this.getWeekNumber(date)}`;
      return '';
    } else {
      // Show only 1st of month
      if (date.getDate() === 1) return date.toLocaleString('default', { month: 'short' });
      return '';
    }
  }

  getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  isWeekend(date: Date): boolean {
    if (this.zoomLevel === 'hour') return false; // No visual noise in hour view
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  isToday(date: Date): boolean {
    const now = new Date();
    if (this.zoomLevel === 'hour') {
      // Highlight current hour?
      return date.getDate() === now.getDate() &&
        date.getHours() === now.getHours();
    }
    return date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  }

  // Positioning Logic
  getColumnWidth(): number {
    switch (this.zoomLevel) {
      case 'hour': return 60; // 60px per hour
      case 'day': return 50;  // 50px per day
      case 'week': return 20; // 20px per day
      case 'month': return 5; // 5px per day
      default: return 50;
    }
  }

  getMsPerColumn(): number {
    if (this.zoomLevel === 'hour') return 3600000; // 1 hour
    return 86400000; // 1 day
  }

  getPxPerMs(): number {
    return this.getColumnWidth() / this.getMsPerColumn();
  }

  getContainerWidth(): number {
    return this.dates.length * this.getColumnWidth();
  }

  getWorkOrdersForCenter(centerId: string): WorkOrderDocument[] {
    return this.workOrders.filter(o => o.data.workCenterId === centerId);
  }

  getBarPosition(order: WorkOrderDocument): { left: string, width: string } {
    const start = new Date(order.data.startDate).getTime();
    const end = new Date(order.data.endDate).getTime();
    const timelineStart = this.startDate.getTime();

    const pxPerMs = this.getPxPerMs();

    const msFromStart = start - timelineStart;
    const durationMs = end - start;

    return {
      left: `${msFromStart * pxPerMs}px`,
      width: `${durationMs * pxPerMs}px`
    };
  }

  // Panel Interactions
  openCreatePanel() {
    this.panelMode = 'create';
    this.selectedOrder = null;
    this.clickedDate = new Date();
    this.panelOpen = true;
  }

  onGridClick(event: MouseEvent, center: WorkCenterDocument) {
    if (this.isDragging) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Inverse calculate date from pixels
    const pxPerMs = this.getPxPerMs();
    const msOffset = x / pxPerMs;
    const clickedTime = this.startDate.getTime() + msOffset;

    this.clickedDate = new Date(clickedTime);
    this.selectedOrder = null;
    this.panelMode = 'create';
    this.panelOpen = true;
  }

  onOrderClick(event: MouseEvent, order: WorkOrderDocument) {
    event.stopPropagation();
    this.selectedOrder = order;
    this.panelMode = 'edit';
    this.panelOpen = true;
  }

  onPanelClose() {
    this.panelOpen = false;
  }

  onGridMouseMove(event: MouseEvent, centerId: string) {
    if (this.isDragging) {
      this.hoveredCenterId = null;
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Snap to day/hour
    const width = this.getColumnWidth();
    const colIndex = Math.floor(x / width);
    const snapX = colIndex * width;

    this.hoveredCenterId = centerId;
    this.hoveredLeft = `${snapX}px`;

    // Optional: Calculate date for tooltip?
    // For now just showing the visual bar
  }

  onGridMouseLeave() {
    this.hoveredCenterId = null;
  }

  onPanelSave(order: WorkOrderDocument) {
    if (this.panelMode === 'create') {
      this.scheduleService.addWorkOrder(order);
    } else {
      this.scheduleService.updateWorkOrder(order);
    }
    this.panelOpen = false;
  }

  onPanelDelete(docId: string) {
    this.scheduleService.deleteWorkOrder(docId);
    this.panelOpen = false;
  }
}
