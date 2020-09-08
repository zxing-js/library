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

});
