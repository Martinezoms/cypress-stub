/// <reference types="cypress" />

describe('share location', () => {
  beforeEach(() => {
    cy.clock();
    cy.fixture('user-location.json').as('userLocation');
    cy.visit('/').then((window) => {
      cy.get('@userLocation').then((fakePosition) => {
        cy.stub(window.navigator.geolocation, 'getCurrentPosition')
          .as('getUserPosition')
          .callsFake((callback) => {
            setTimeout(() => {
              callback(fakePosition);
            }, 100);
          });
      });

      cy.stub(window.navigator.clipboard, 'writeText')
        .as('copyToClipboard')
        .resolves();

      cy.spy(window.localStorage, 'setItem').as('storeLocation');
      cy.spy(window.localStorage, 'getItem').as('getStoredLocation');
    });
  });

  it('should fetch the user location', () => {
    cy.get('[data-cy="get-loc-btn"]').click();
    cy.get('@getUserPosition').should('have.been.called');

    cy.get('[data-cy="get-loc-btn"]').should('be.disabled');
    cy.get('[data-cy="actions"').contains('Location fetched!');
  });

  it('should share location URL', () => {
    cy.get('[data-cy="name-input"]').type('John Doe');
    cy.get('[data-cy="get-loc-btn"]').click();
    cy.get('[data-cy="share-loc-btn"]').should('not.be.disabled').click();
    cy.get('@copyToClipboard').should('have.been.called');
    cy.get('@userLocation').then((fakePosition) => {
      const { latitude, longitude } = fakePosition.coords;
      cy.get('@copyToClipboard').should(
        'have.been.calledWithMatch',
        new RegExp(`${latitude}.*${longitude}.*${encodeURI('John Doe')}`)
      );

      cy.get('@storeLocation').should(
        'have.been.calledWithMatch',
        /John Doe/,
        new RegExp(`${latitude}.*${longitude}.*${encodeURI('John Doe')}`)
      );
    });
    cy.get('@storeLocation').should('have.been.called');
    cy.get('[data-cy="share-loc-btn"]').click();
    cy.get('@getStoredLocation').should('have.been.called');
    cy.get('[data-cy="info-message"]').should('be.visible');
    cy.tick(2000);
    cy.get('[data-cy="info-message"]').should('not.be.visible');
  });
});
