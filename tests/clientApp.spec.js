describe('app', function() {
    it('Подключается без ошибок', function(done) {
        require('../clientApp/index.js');
        done();
    });
});