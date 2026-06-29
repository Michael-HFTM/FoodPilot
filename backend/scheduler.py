import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from database import SessionLocal
from hardware.dispenser import trigger_feeding
from models.feeding import FeedingLog, FeedingSchedule, Size

logger = logging.getLogger("uvicorn.error")

scheduler = BackgroundScheduler()


def _run_scheduled_feeding(schedule_id: int, size: str) -> None:
    db = SessionLocal()
    try:
        success = trigger_feeding(Size(size))
        db.add(FeedingLog(
            schedule_id=schedule_id,
            size=size,
            success=success,
            note=None if success else "Scheduled feeding failed",
        ))
        db.commit()
        logger.info(f"Scheduled feeding {schedule_id} ({size}): {'ok' if success else 'FAILED'}")
    except Exception:
        logger.exception(f"Unexpected error in scheduled feeding {schedule_id}")
    finally:
        db.close()


def reload_scheduler() -> None:
    """Remove all jobs and re-register every enabled schedule from the DB."""
    scheduler.remove_all_jobs()
    db = SessionLocal()
    try:
        schedules = (
            db.query(FeedingSchedule)
            .filter(FeedingSchedule.enabled.is_(True))
            .all()
        )
        for s in schedules:
            h, m = s.time.split(":")
            scheduler.add_job(
                _run_scheduled_feeding,
                CronTrigger(hour=int(h), minute=int(m)),
                id=str(s.id),
                args=[s.id, s.size],
                replace_existing=True,
            )
            logger.info(f"Scheduled: '{s.name}' at {s.time} (size={s.size})")
    finally:
        db.close()
