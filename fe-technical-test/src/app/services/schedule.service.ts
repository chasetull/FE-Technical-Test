import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { WorkCenterDocument, WorkOrderDocument, WorkOrderStatus } from '../models/work-order.model';

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {

    private _workCenters: BehaviorSubject<WorkCenterDocument[]> = new BehaviorSubject<WorkCenterDocument[]>([]);
    public workCenters$: Observable<WorkCenterDocument[]> = this._workCenters.asObservable();

    private _workOrders: BehaviorSubject<WorkOrderDocument[]> = new BehaviorSubject<WorkOrderDocument[]>([]);
    public workOrders$: Observable<WorkOrderDocument[]> = this._workOrders.asObservable();

    constructor() {
        this.initializeMockData();
    }

    private initializeMockData() {
        // 5 Work Centers
        const workCenters: WorkCenterDocument[] = [
            { docId: 'wc-1', docType: 'workCenter', data: { name: 'Extrusion Line A' } },
            { docId: 'wc-2', docType: 'workCenter', data: { name: 'CNC Machine 1' } },
            { docId: 'wc-3', docType: 'workCenter', data: { name: 'Assembly Station' } },
            { docId: 'wc-4', docType: 'workCenter', data: { name: 'Quality Control' } },
            { docId: 'wc-5', docType: 'workCenter', data: { name: 'Packaging Line' } }
        ];

        // Helper to format date
        const today = new Date();
        const getISO = (offsetDays: number) => {
            const d = new Date(today);
            d.setDate(today.getDate() + offsetDays);
            return d.toISOString().split('T')[0];
        };

        // 8+ Work Orders
        const workOrders: WorkOrderDocument[] = [
            { docId: 'wo-1', docType: 'workOrder', data: { name: 'Order #1001', workCenterId: 'wc-1', status: 'complete', startDate: getISO(-5), endDate: getISO(-2) } },
            { docId: 'wo-2', docType: 'workOrder', data: { name: 'Order #1002', workCenterId: 'wc-1', status: 'in-progress', startDate: getISO(-1), endDate: getISO(3) } },

            { docId: 'wo-3', docType: 'workOrder', data: { name: 'Order #2001', workCenterId: 'wc-2', status: 'open', startDate: getISO(0), endDate: getISO(4) } },

            { docId: 'wo-4', docType: 'workOrder', data: { name: 'Order #3001', workCenterId: 'wc-3', status: 'blocked', startDate: getISO(-3), endDate: getISO(0) } },
            { docId: 'wo-5', docType: 'workOrder', data: { name: 'Order #3002', workCenterId: 'wc-3', status: 'open', startDate: getISO(2), endDate: getISO(6) } },

            { docId: 'wo-6', docType: 'workOrder', data: { name: 'Order #4001', workCenterId: 'wc-4', status: 'in-progress', startDate: getISO(-2), endDate: getISO(1) } },

            { docId: 'wo-7', docType: 'workOrder', data: { name: 'Order #5001', workCenterId: 'wc-5', status: 'complete', startDate: getISO(-10), endDate: getISO(-5) } },
            { docId: 'wo-8', docType: 'workOrder', data: { name: 'Order #5002', workCenterId: 'wc-5', status: 'open', startDate: getISO(-2), endDate: getISO(5) } }
        ];

        this._workCenters.next(workCenters);
        this._workOrders.next(workOrders);
    }

    getWorkOrders(): Observable<WorkOrderDocument[]> {
        return this.workOrders$;
    }

    getWorkCenters(): Observable<WorkCenterDocument[]> {
        return this.workCenters$;
    }

    addWorkOrder(order: WorkOrderDocument): void {
        const current = this._workOrders.getValue();
        this._workOrders.next([...current, order]);
    }

    updateWorkOrder(updatedOrder: WorkOrderDocument): void {
        const current = this._workOrders.getValue();
        const index = current.findIndex(o => o.docId === updatedOrder.docId);
        if (index !== -1) {
            const updated = [...current];
            updated[index] = updatedOrder;
            this._workOrders.next(updated);
        }
    }

    deleteWorkOrder(docId: string): void {
        const current = this._workOrders.getValue();
        this._workOrders.next(current.filter(o => o.docId !== docId));
    }

    checkOverlap(workCenterId: string, startDate: string, endDate: string, excludeDocId?: string): boolean {
        const orders = this._workOrders.getValue().filter(o =>
            o.data.workCenterId === workCenterId &&
            o.docId !== excludeDocId
        );

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return orders.some(o => {
            const oStart = new Date(o.data.startDate).getTime();
            const oEnd = new Date(o.data.endDate).getTime();
            // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
            return (start <= oEnd && end >= oStart);
        });
    }
}
