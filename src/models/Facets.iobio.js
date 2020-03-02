// class to interact with backend for facets files
class facetsIobio {
    constructor(theEndpoint) {
       this.endpoint = theEndpoint;
    }

    checkFacetsFormat(url, bamUrl, callback) {
        let cmd = this.endpoint.checkFacetsFile(url, bamUrl);
        let success = null;
        cmd.on('data', function (data) {
            if (data != null && data !== '') {
                success = true;
            }
        });
        cmd.on('end', function () {
            if (success == null) {
                success = true;
            }
            if (success) {
                callback(success);
            }
        });
        cmd.on('error', function (error) {
            if (success == null) {
                success = false;
                callback(success, error);
            }
        });
        cmd.run();
    }
}
export default facetsIobio