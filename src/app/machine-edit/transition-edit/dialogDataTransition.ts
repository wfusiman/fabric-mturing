export interface DialogDataTransition {
    // datos de retorno
    symbolRead: string;
    action_value: string;
    action: string;
    origin_select: string;
    destiny_select: string;
    // datos entrada 
    alphabets: string[];
    states_origin: string[];
    states_destiny: string[];
    mode: string;
    num: number;
    compuesta: boolean;
}