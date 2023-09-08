import moment from 'moment';
export function parseDate(dateString)
{
    const dateParts = dateString.split(/[- :]/); // Split the string by '-', ' ', and ':'
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months in JavaScript are zero-based (0 = January)
    const day = parseInt(dateParts[2], 10);
    const hour = parseInt(dateParts[3], 10);
    const minute = parseInt(dateParts[4], 10);
    const parsedDate = new Date(year, month, day, hour, minute);
    const formattedDate = moment(parsedDate).format('YYYY-MM-DD');
    return formattedDate;
}
export function parseDateTime(dateString)
{
    const dateParts = dateString.split(/[- :]/); // Split the string by '-', ' ', and ':'
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months in JavaScript are zero-based (0 = January)
    const day = parseInt(dateParts[2], 10);
    const hour = parseInt(dateParts[3], 10);
    const minute = parseInt(dateParts[4], 10);
    const parsedDate = new Date(year, month, day, hour, minute);
    const formattedDate = moment(parsedDate).format('YYYY-MM-DD HH:mm:ss');
    return formattedDate;
}
