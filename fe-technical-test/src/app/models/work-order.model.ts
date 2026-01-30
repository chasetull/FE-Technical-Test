export interface WorkCenterDocument {
    docId: string;
    docType: 'workCenter';
    data: {
        name: string;
    };
}

export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';

export interface WorkOrderDocument {
    docId: string;
    docType: 'workOrder';
    data: {
        name: string;
        workCenterId: string;
        status: WorkOrderStatus;
        startDate: string; // ISO format "2025-01-15"
        endDate: string;   // ISO format
    };
}
