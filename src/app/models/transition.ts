
export interface Transition {
    num: number;
    symbolRead: string;
    action: string;
    action_value: string; 
    stateFrom: string;
    stateTo: string;
}