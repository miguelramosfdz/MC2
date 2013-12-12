/**
 * This is generated code - it will be overwritten. Do not modify.
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 */

function InvokeService(path, method, data, cb) {
   if (typeof(data) == "function") {
      cb = data; data = null;
   }
   var xhr = Ti.Network.createHTTPClient();
   if (typeof(cb) == "function") {
        xhr.onload = function(e) {
           var r = this.responseText;
           if (xhr.getResponseHeader("content-type").indexOf("json") != -1) {
               try { r = JSON.parse(r); } catch (E) { }
           }
           cb(r, e);
        };
   }
   if(exports.URL.match('/$') == '/' && path.indexOf('/') == 0) {
       xhr.open(method, exports.URL + path.substring(1));
   } else {
       xhr.open(method, exports.URL + path);
   }
   xhr.send(data);
};

var url = Ti.App.Properties.getString("acs-service-baseurl-meetcute.api");

if(url && url.replace(/^\s+|\s+$/g, "")) {
   exports.URL = url.replace(/^\s+|\s+$/g, "");
} else {
   exports.URL = "http://localhost:8080";
}

exports.application_index = function (data, cb) {
   InvokeService("/", "GET", data, cb);
};

exports.application_login = function (data, cb) {
   InvokeService("/login", "GET", data, cb);
};

exports.user_login = function (data, cb) {
   InvokeService("/login", "POST", data, cb);
};

exports.user_logout = function (data, cb) {
   InvokeService("/logout", "GET", data, cb);
};

exports.places_cross_path = function (data, cb) {
   InvokeService("/api/cross_path", "POST", data, cb);
};

exports.places_push = function (data, cb) {
   InvokeService("/api/push", "POST", data, cb);
};

exports.places_update_event = function (data, cb) {
   InvokeService("/api/update_event", "POST", data, cb);
};

exports.user_filter_matchers = function (data, cb) {
   InvokeService("/api/filter_matchers", "POST", data, cb);
};

exports.photos_index = function (data, cb) {
   InvokeService("/photos", "GET", data, cb);
};

exports.photos_approve = function (data, cb) {
   InvokeService("/photos/approve", "POST", data, cb);
};

exports.photos_get = function (data, cb) {
   InvokeService("/photos/get", "GET", data, cb);
};

exports.places_index = function (data, cb) {
   InvokeService("/places", "GET", data, cb);
};

exports.places_approve = function (data, cb) {
   InvokeService("/places/approve", "POST", data, cb);
};
