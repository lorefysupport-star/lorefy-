import Foundation
import Capacitor
import StoreKit

// A verified transaction is finished only after the server grants ownership.
@objc(LorefyPurchasesPlugin)
class LorefyPurchases: CAPPlugin, CAPBridgedPlugin {
    let identifier = "LorefyPurchasesPlugin"
    let jsName = "LorefyPurchases"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pending", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise)
    ]
    private let allowed = Set(["night-gaze", "signal-drift", "midnight-bloom", "crimson-current", "maple-scout", "twilight-den", "amber-drift", "woodland-lantern", "moon-fox", "ribbon-bunny", "ember-tiger", "mint-raccoon"].map { "com.lorefy.app.decorations." + $0.replacingOccurrences(of: "-", with: "_") })
    private var listener: Task<Void, Never>?

    override func load() {
        listener = Task { [weak self] in
            for await result in Transaction.updates {
                guard let self, case .verified(let transaction) = result, self.allowed.contains(transaction.productID) else { continue }
                self.notifyListeners("transactionsUpdated", data: ["transactionId": String(transaction.id)])
            }
        }
    }
    deinit { listener?.cancel() }

    @objc func products(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? []
        guard !ids.isEmpty, ids.count <= 12, ids.allSatisfy({ allowed.contains($0) }) else { call.reject("Unknown product"); return }
        Task {
            do {
                let found = try await Product.products(for: ids)
                call.resolve(["products": found.filter { $0.type == .nonConsumable }.map { ["id": $0.id, "displayPrice": $0.displayPrice, "price": NSDecimalNumber(decimal: $0.price).stringValue, "currency": $0.priceFormatStyle.currencyCode] }])
            } catch { call.reject("Products unavailable") }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId"), allowed.contains(id), let token = call.getString("appAccountToken"), let account = UUID(uuidString: token) else { call.reject("Invalid purchase"); return }
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [id]).first, product.type == .nonConsumable else { call.reject("Product unavailable"); return }
                switch try await product.purchase(options: [.appAccountToken(account)]) {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else { call.reject("Transaction unverified"); return }
                    call.resolve(["status": "success", "transactionId": String(transaction.id), "signedTransaction": verification.jwsRepresentation])
                case .pending: call.resolve(["status": "pending"])
                case .userCancelled: call.resolve(["status": "cancelled"])
                @unknown default: call.reject("Unknown purchase result")
                }
            } catch { call.reject("Purchase failed") }
        }
    }

    private func current(_ call: CAPPluginCall, sync: Bool) {
        guard let token = call.getString("appAccountToken"), let account = UUID(uuidString: token) else { call.reject("Invalid account"); return }
        Task {
            do {
                if sync { try await AppStore.sync() }
                var rows: [[String: String]] = []
                for await result in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = result, allowed.contains(transaction.productID), transaction.appAccountToken == account, transaction.revocationDate == nil else { continue }
                    rows.append(["transactionId": String(transaction.id), "signedTransaction": result.jwsRepresentation])
                }
                call.resolve(["transactions": rows])
            } catch { call.reject("Restore failed") }
        }
    }
    @objc func restore(_ call: CAPPluginCall) { current(call, sync: true) }
    @objc func pending(_ call: CAPPluginCall) { current(call, sync: false) }

    @objc func finish(_ call: CAPPluginCall) {
        guard let value = call.getString("transactionId"), let id = UInt64(value) else { call.reject("Invalid transaction"); return }
        Task {
            for await result in Transaction.unfinished {
                if case .verified(let transaction) = result, transaction.id == id, allowed.contains(transaction.productID) {
                    await transaction.finish(); call.resolve(); return
                }
            }
            call.resolve()
        }
    }
}
