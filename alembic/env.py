from logging.config import fileConfig
import os
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# ----------------------------------------------------
# ✅ Load environment variables from .env
# ----------------------------------------------------
load_dotenv()

# ----------------------------------------------------
# ✅ Load Alembic configuration
# ----------------------------------------------------
config = context.config

# ✅ Override the database URL from .env
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# ----------------------------------------------------
# ✅ Logging
# ----------------------------------------------------
fileConfig(config.config_file_name)

# ----------------------------------------------------
# ✅ Import your app's Base model and metadata
# ----------------------------------------------------
from api.database import Base  # adjust path if needed
from api import models          # import models so Alembic can detect them

target_metadata = Base.metadata


# ----------------------------------------------------
# ✅ Migration functions
# ----------------------------------------------------
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
