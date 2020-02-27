import { SET_ALERT, REMOVE_ALERT } from './types';
import {v4 as uuid} from 'uuid';

const setAlert = ( msg, alertType ) => dispatch => {
    const id = uuid.v4();
    dispatch({
        type: SET_ALERT,
        payload : { msg, alertType, id }
    });
}
export default setAlert;