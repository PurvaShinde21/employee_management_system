"""
Pytest configuration — creates an in-memory SQLite test database
and a reusable Flask test client.
"""
import pytest
from app.main import app, db


@pytest.fixture(scope='module')
def test_client():
    """Provide a Flask test client backed by an in-memory SQLite DB."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.drop_all()
