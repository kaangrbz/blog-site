$(window).on('load', () => {
  var url_string = window.location.href
  var url = new URL(url_string);
  var c = url.searchParams.get("utm_source");
  if (c) {
    url = '/from/' + c
    $.post(url, res => {
      console.log(res);
    })
  }
})