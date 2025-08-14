import "Staking"

transaction() {
    prepare (acct: auth(Storage) &Account) {
        if !acct.storage.check<@Staking.UserCertificate>(from: Staking.UserCertificateStoragePath) {
            acct.storage.save(
                <- Staking.setupUser(),
                to: Staking.UserCertificateStoragePath
            )
        }
    }
}