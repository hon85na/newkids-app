import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Platform, Linking, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const HOME = 'https://newkids.net';
const INNER = ['newkids.net', 'www.newkids.net', 'accounts.google.com', 'kauth.kakao.com', 'accounts.kakao.com', 'nid.naver.com', 'appleid.apple.com'];
const FILE_EXT = /\.(pdf|docx?|xlsx?|pptx?|hwpx?|zip|apk)(\?|#|$)/i;
const TABS = [
  { k: 'home', t: '홈', p: '/', i: '🏠' },
  { k: 'horse', t: '승마체험', p: '/horse', i: '🐴' },
  { k: 'class', t: '파견수업', p: '/dispatch', i: '🏃' },
  { k: 'book', t: '예약·문의', p: '/book', i: '📅' },
  { k: 'job', t: '채용', p: '/job', i: '💼' },
];

function activeTab(path) {
  if (path.startsWith('/horse') || path.startsWith('/trip')) return 'horse';
  if (path.startsWith('/dispatch') || path.startsWith('/q') || path.startsWith('/programs')) return 'class';
  if (path.startsWith('/book') || path.startsWith('/event') || path.startsWith('/rental')) return 'book';
  if (path.startsWith('/job') || path.startsWith('/recruit')) return 'job';
  return 'home';
}

export default function App() {
  const ref = useRef(null);
  const [canBack, setCanBack] = useState(false);
  const [path, setPath] = useState('/');
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canBack && ref.current) { ref.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [canBack]);

  const go = useCallback((p) => {
    setOffline(false);
    if (ref.current) ref.current.injectJavaScript('window.location.href=' + JSON.stringify(HOME + p) + ';true;');
  }, []);

  const onShould = useCallback((req) => {
    const url = req.url || '';
    if (req.isTopFrame === false) return true;
    if (/^(about:|data:|blob:)/i.test(url)) return true;
    const m = url.match(/^(https?):\/\/([^\/?#:]+)/i);
    if (m) {
      const host = m[2].toLowerCase();
      if (FILE_EXT.test(url)) { Linking.openURL(url).catch(() => {}); return false; }
      if (INNER.includes(host) || host.endsWith('.newkids.net')) return true;
      Linking.openURL(url).catch(() => {});
      return false;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const onNav = useCallback((st) => {
    setCanBack(!!st.canGoBack);
    const m = (st.url || '').match(/^https?:\/\/[^\/]+(\/[^?#]*)?/i);
    if (m) setPath(m[1] || '/');
  }, []);

  const active = activeTab(path);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#151E49" />
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.web}>
          {offline ? (
            <View style={s.off}>
              <Text style={s.offT}>인터넷에 연결되어 있지 않습니다</Text>
              <Text style={s.offS}>연결을 확인한 뒤 다시 시도해 주세요.</Text>
              <TouchableOpacity style={s.btn} onPress={() => { setOffline(false); setLoading(true); setKey((k) => k + 1); }}>
                <Text style={s.btnT}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              key={key}
              ref={ref}
              source={{ uri: HOME + '/' }}
              applicationNameForUserAgent="NewkidsApp/1.0"
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              cacheEnabled
              pullToRefreshEnabled
              allowsBackForwardNavigationGestures
              setSupportMultipleWindows={false}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onShouldStartLoadWithRequest={onShould}
              onNavigationStateChange={onNav}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setOffline(true); }}
              onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500) { /* 서버 오류는 페이지가 그대로 보여 줌 */ } }}
              onFileDownload={({ nativeEvent }) => { if (nativeEvent && nativeEvent.downloadUrl) Linking.openURL(nativeEvent.downloadUrl).catch(() => {}); }}
              style={{ flex: 1, backgroundColor: '#fffdf8' }}
            />
          )}
          {loading && !offline ? (
            <View style={s.load} pointerEvents="none"><ActivityIndicator size="large" color="#151E49" /></View>
          ) : null}
        </View>
        <SafeAreaView edges={['bottom']} style={s.bar}>
          <View style={s.row}>
            {TABS.map((t) => (
              <TouchableOpacity key={t.k} style={s.tab} onPress={() => go(t.p)} accessibilityRole="button" accessibilityLabel={t.t}>
                <Text style={[s.ic, active === t.k && s.icOn]}>{t.i}</Text>
                <Text style={[s.tt, active === t.k && s.ttOn]}>{t.t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#151E49' },
  web: { flex: 1, backgroundColor: '#fffdf8' },
  load: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffdf8' },
  off: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#fffdf8' },
  offT: { fontSize: 18, fontWeight: '700', color: '#151E49', marginBottom: 8 },
  offS: { fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: '#151E49', paddingHorizontal: 26, paddingVertical: 12, borderRadius: 24 },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bar: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#d9d9e3' },
  row: { flexDirection: 'row', height: 56 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ic: { fontSize: 20, opacity: 0.55 },
  icOn: { opacity: 1 },
  tt: { fontSize: 11, color: '#7a7f99', marginTop: 2 },
  ttOn: { color: '#151E49', fontWeight: '700' },
});
