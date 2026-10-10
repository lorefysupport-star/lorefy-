import Foundation
import Capacitor
import CryptoKit

@objc(LorefyAuthCryptoPlugin)
class LorefyAuthCrypto: CAPPlugin, CAPBridgedPlugin {
    let identifier = "LorefyAuthCryptoPlugin"
    let jsName = "LorefyAuthCrypto"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "sha256", returnType: CAPPluginReturnPromise)
    ]

    @objc func sha256(_ call: CAPPluginCall) {
        guard let value = call.getString("value"), value.utf8.count <= 4096 else {
            call.reject("Invalid authentication hash input")
            return
        }
        let digest = SHA256.hash(data: Data(value.utf8))
        call.resolve(["hex": digest.map { String(format: "%02x", $0) }.joined()])
    }
}

class LorefyBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LorefyAuthCrypto())
    }
}
