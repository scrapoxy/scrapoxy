import java.net.*;
import java.net.http.*;
import java.security.*;
import javax.net.ssl.*;


class TestApp {
    private static HttpResponse<String> doRequest(HttpClient client, String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(new URI(url))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        return response;
    }

    private static TrustManager[] trustAllCerts = new TrustManager[]{
        new X509TrustManager() {
            public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                return null;
            }

            public void checkClientTrusted(
                java.security.cert.X509Certificate[] certs, String authType) {
            }

            public void checkServerTrusted(
                java.security.cert.X509Certificate[] certs, String authType) {
            }
        }
    };

    public static void main(String[] args) throws Exception {
        int masterPort = Integer.parseInt(System.getenv("MASTER_PORT"));

        SSLContext sc = SSLContext.getInstance("SSL");
        sc.init(null, trustAllCerts, new java.security.SecureRandom());

        Authenticator authenticator = new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("fake",
                    "token".toCharArray());
            }
        };

        HttpClient client = HttpClient.newBuilder()
            .proxy(ProxySelector.of(new InetSocketAddress("127.0.0.1", masterPort)))
            .authenticator(authenticator)
            .sslContext(sc)
            .build();

        // HTTP over HTTP
        String serversPortHttp = System.getenv("SERVERS_PORT_HTTP");
        HttpResponse<String> responseHttp = doRequest(client, String.format("http://localhost:%s/file/big?size=1024", serversPortHttp));
        if (responseHttp.statusCode() != 200) {
            throw new Exception("cannot reach HTTP over HTTP");
        }

        // HTTPS over HTTP tunnel
        String serversPortHttps = System.getenv("SERVERS_PORT_HTTPS");
        HttpResponse<String> responseHttps = doRequest(client, String.format("https://localhost:%s/file/big?size=1024", serversPortHttps));
        System.out.println(responseHttps.body());
        if (responseHttps.statusCode() != 200) {
            throw new Exception("cannot reach HTTPS over HTTP tunnel");
        }
    }
}
