/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/e2e/pages/qr-camera/index.html');
  });

  describe('Start Decoding from camera', () => {
    it('decodes some result from web camera stream', () => {
      cy.get('#startButton').click();
      cy.get('#result').should('have.text', '192.168.1.13:3000')
    });
  });

  describe('Instantiates ZXing', () => {
    it('has ZXing imported into window and creates instace', () => {
      cy.window().should('have.property', 'ZXing');
      cy.window().then((win) => {
        // call whatever you want on your app's window
        // so your app methods must be exposed somehow
        const codeReader = new win.ZXing.BrowserQRCodeReader();
        expect(codeReader).to.not.be.null;
      });
    });
  });

});
