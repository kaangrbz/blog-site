var timeago = require('timeago.js')
var tr_TR = function (number, index, totalSec) {
   return [
      ['şimdi', 'az önce'],
      ['%s saniye önce', '%s saniye içinde'],
      ['1 dakika önce', '1 dakika içinde'],
      ['%s dakika önce', '%s dakika içinde'],
      ['1 saat önce', '1 saat içinde'],
      ['%s saat önce', '%s saat içinde'],
      ['1 gün önce', '1 gün içinde'],
      ['%s gün önce', '%s gün içinde'],
      ['1 hafta önce', '1 hafta içinde'],
      ['%s hafta önce', '%s hafta içinde'],
      ['1 ay önce', '1 ay içinde'],
      ['%s ay önce', '%s ay içinde'],
      ['1 yıl önce', '1 yıl içinde'],
      ['%s yıl önce', '%s yıl içinde']
   ][index];
};
timeago.register('tr_TR', tr_TR);

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
function formatDate(date, mode) {
    mdate = date;
    hour = date.getHours()
    minute = date.getMinutes()
    if (hour < 10) hour = '0' + mdate.getHours()
    if (minute < 10) minute = '0' + mdate.getMinutes()
    normaldate = date.getDate() + "." + date.getMonth() + "." + date.getFullYear()
    fulldate = date.getDate() + "." + date.getMonth() + "." + date.getFullYear() + " • " + hour + ":" + minute
    formatted = timeago.format(date, 'tr_TR')
    try {
        if (mode == 'timeago') {
            return formatted
        }
        else if (mode == 'date') {
            return normaldate
        }
        else if (mode == 'fulldate') {
            return fulldate
        }
        else {
            return ''
        }
    } catch (error) {
        console.log('formatDate catch error');
        console.log(error);
        return false
    }
}

function checkAuthority(number) {
    mnumber = Number(number)
    if (!isNaN(mnumber)) {
        if (number === 100) {
            return true
        }
        else {
            return false
        }
    }
    return false
}
module.exports = {validateEmail, formatDate,checkAuthority}