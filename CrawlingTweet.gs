// 前提:
// ①Twitter Developerアカウントの登録が完了していること
//  注意: callbackURLは、"スクリプトID"を埋め込んだURLを設定すること
// ②GASライブラリの「OAuth1」をリソース>ライブラリに設定していること
//  参考: https://github.com/gsuitedevs/apps-script-oauth1/blob/master/dist/OAuth1.gs

// DeveloperアカウントのKeyをセット
var CONSUMER_KEY = '{Consumer_key}';
var CONSUMER_SECRET = '{Consumer_secret_key}';

// Tweet投稿
function postTweet() {
  
  var dt = new Date();
  var service = getService();
  
  if (service.hasAccess()) {
    var url = 'https://api.twitter.com/1.1/statuses/update.json';
    var payload = {
      status: 'It\'s a tweet from Google Apps Script. Yeah !!' + dt
    };
    var response = service.fetch(url, {
      method: 'post',
      payload: payload
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}

// タイムラインの取得
function getMyTimeLine() {
  
  var service = getService();
  
  var tweets = "";
  if (service.hasAccess()) {
    var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json';
    var json = service.fetch(url);
    var array = JSON.parse(json);
    
    var tweets = array.map(function(tweet){
      tweets = tweet.text;
    });
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
    tweets = "No Tweets.";
  }
  
  Logger.log(tweets);
  return tweets;
}

// ツイートの検索
function searchTweert() {
  // 検索するワードを指定
  var serchText = "人工知能";
  var query = encodeURIComponent(serchText);
  var service = getService();
  
  var tweets = "";
  if (service.hasAccess()) {
    // 検索ワード&検索結果数&最近のツイートを抽出
    var url = 'https://api.twitter.com/1.1/search/tweets.json?q=' + query + '&count=100&result_type=recent';
    
    var response = service.fetch(url, {
        muteHttpExceptions: true,
        method: 'get'
    });
    var json = JSON.parse(response.getContentText());
    
    tweets = json.statuses;
    if (tweets.length === 0) {
      tweets = "Searched Tweets\: 0."
    } else {
      outputToSpreadSheet(serchText, tweets)
    }
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
    tweets = "Can\'t Tweets.";
  }
  
  Logger.log(tweets);
  return tweets;
}

// 取得したツイートをSpreadSheetへ出力
// @param query  検索キーワード
// @param tweets 取得したツイート情報
function outputToSpreadSheet(query, tweets) {
  
    var WEB_URL = 'https://twitter.com/';
  
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    SpreadsheetApp.setActiveSheet(ss.getSheets()[0]);
  
    var as = SpreadsheetApp.getActiveSheet();
    var cell = as.getRange('A1');
    var lastRow = as.getLastRow();
  
    var firstId = tweets[tweets.length - 1].id_str;
    var row = 0;
    var col = 0;
  
    // SpreadSheetへの出力行数の調整
    for (var i = 0; i < lastRow; i++) {

        id = cell.offset(i, 0).getValue();

        if (!id) {
            Logger.log('id:' + id);
            break;
        }
        if (firstId == id) {
            Logger.log(id + '==' + firstId);
            break;
        }

        // 出力開始行を1行下げる
        row++;
    }
  
    // SpreadSheetに出力
    for (var j = 0; j < tweets.length; j++) {
        result = tweets[j];
        dd = new Date(result.created_at);
        col = 0;
        cell.offset(row, col++).setValue(query);
        cell.offset(row, col++).setValue(result.id_str);
        cell.offset(row, col++).setValue(dd.toLocaleString());
        cell.offset(row, col++).setValue(result.text);
        //cell.offset(row, col++).setValue(WEB_URL + result.user.screen_name + '/status/' + result.id_str);
        //cell.offset(row, col++).setValue(WEB_URL + result.user.screen_name);
        row++;
    }
}

// 認証のリセット(リセット後は再度認証が必要)
function reset() {
  var service = getService();
  service.reset();
}

// Twitter APIへの認証
function getService() {
  return OAuth1.createService('Twitter')
      // Set the endpoint URLs.
      .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')

      // Set the consumer key and secret.
      .setConsumerKey(CONSUMER_KEY)
      .setConsumerSecret(CONSUMER_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

// 認証後のcallbackを定義
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}