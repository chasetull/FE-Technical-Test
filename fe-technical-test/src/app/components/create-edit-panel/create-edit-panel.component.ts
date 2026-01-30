import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateStruct, NgbDatepickerModule, NgbDateAdapter, NgbDateNativeAdapter } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { WorkCenterDocument, WorkOrderDocument, WorkOrderStatus } from '../../models/work-order.model';
import { ScheduleService } from '../../services/schedule.service';

@Component({
  selector: 'app-create-edit-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatepickerModule, NgSelectModule],
  providers: [{ provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }],
  templateUrl: './create-edit-panel.component.html',
  styleUrls: ['./create-edit-panel.component.scss']
})
export class CreateEditPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() workOrder: WorkOrderDocument | null = null;
  @Input() workCenters: WorkCenterDocument[] = [];
  @Input() initialDate: Date | null = null; // For create mode

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<WorkOrderDocument>();
  @Output() delete = new EventEmitter<string>();

  form: FormGroup;
  statusOptions: { value: WorkOrderStatus, label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'blocked', label: 'Blocked' }
  ];

  errorMsg: string | null = null;

  constructor(private fb: FormBuilder, private scheduleService: ScheduleService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      workCenterId: [null, Validators.required],
      status: ['open', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      if (this.mode === 'edit' && this.workOrder) {
        this.populateForm(this.workOrder);
      } else if (this.mode === 'create') {
        this.setupCreateDefaults();
      }
    }
  }

  resetForm() {
    this.form.reset({
      status: 'open'
    });
    this.errorMsg = null;
  }

  setupCreateDefaults() {
    if (this.initialDate) {
      const start = new Date(this.initialDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 7); // Default 7 days

      this.form.patchValue({
        startDate: start,
        endDate: end
      });
    }
  }

  populateForm(order: WorkOrderDocument) {
    this.form.patchValue({
      name: order.data.name,
      workCenterId: order.data.workCenterId,
      status: order.data.status,
      startDate: new Date(order.data.startDate),
      endDate: new Date(order.data.endDate)
    });
  }

  onSave() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const start = val.startDate as Date;
    const end = val.endDate as Date;

    // Validate logical dates
    if (start > end) {
      this.errorMsg = "End date must be after start date.";
      return;
    }

    // Convert to ISO string for storage/comparison
    // Using local time to simple ISO YYYY-MM-DD for this exercise
    // (Handling timezones is complex, assuming simple date selection here)
    const toISO = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - (offset * 60 * 1000));
      return local.toISOString().split('T')[0];
    };

    const startIso = toISO(start);
    const endIso = toISO(end);

    // Check overlap
    const excludeId = this.mode === 'edit' && this.workOrder ? this.workOrder.docId : undefined;
    const hasOverlap = this.scheduleService.checkOverlap(val.workCenterId, startIso, endIso, excludeId);

    if (hasOverlap) {
      this.errorMsg = "This schedule overlaps with an existing work order on this Work Center.";
      return;
    }

    const docId = this.mode === 'edit' && this.workOrder ? this.workOrder.docId : `wo-${Date.now()}`;

    const newOrder: WorkOrderDocument = {
      docId: docId,
      docType: 'workOrder',
      data: {
        name: val.name,
        workCenterId: val.workCenterId,
        status: val.status,
        startDate: startIso,
        endDate: endIso
      }
    };

    this.save.emit(newOrder);
    this.close.emit();
  }

  onDelete() {
    if (this.mode === 'edit' && this.workOrder) {
      this.delete.emit(this.workOrder.docId);
      this.close.emit();
    }
  }
}
