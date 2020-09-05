/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/examples/multi-camera/');
  });

  describe('My First Test', () => {
    it('Does not do much!', () => {
      cy.get('#startButton').click();
      expect(true).to.equal(true);
    });
  });

});
