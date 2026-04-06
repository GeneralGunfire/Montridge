"""
Master Pipeline Orchestrator
Runs RSS fetching + AI processing every 5 hours via Task Scheduler
"""

import sys
import os
import subprocess
from datetime import datetime
import logging

# Setup logging
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
log_filename = f'pipeline_{timestamp}.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def print_header(title):
    """Print formatted section header."""
    logger.info("\n" + "="*70)
    logger.info(f"  {title}")
    logger.info("="*70 + "\n")


def run_rss_fetcher():
    """Run the RSS fetcher script."""
    print_header("STEP 1: RSS FETCHER")
    logger.info(">> Fetching articles from news sources...\n")

    try:
        # Get the backend directory path
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        result = subprocess.run(
            [sys.executable, os.path.join(backend_dir, 'rss_fetcher.py')],
            capture_output=True,
            text=True,
            check=True,
            cwd=backend_dir
        )
        
        logger.info(result.stdout)
        
        if result.stderr:
            logger.warning(f"RSS Fetcher warnings:\n{result.stderr}")
        
        logger.info("[OK] RSS fetching complete!\n")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"[ERROR] RSS Fetcher failed with error:\n{e.stderr}")
        return False
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in RSS Fetcher: {e}")
        return False


def run_ai_processor():
    """Run the AI processor script."""
    print_header("STEP 2: AI PROCESSOR")
    logger.info(">> Processing articles with AI...\n")

    try:
        # Get the backend directory path
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        result = subprocess.run(
            [sys.executable, os.path.join(backend_dir, 'ai_processor.py')],
            capture_output=True,
            text=True,
            check=True,
            cwd=backend_dir
        )
        
        logger.info(result.stdout)
        
        if result.stderr:
            logger.warning(f"AI Processor warnings:\n{result.stderr}")
        
        logger.info("[OK] AI processing complete!\n")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"[ERROR] AI Processor failed with error:\n{e.stderr}")
        return False
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in AI Processor: {e}")
        return False


def main():
    """Run the complete pipeline."""
    start_time = datetime.now()
    
    print_header("MONTRIDGE PIPELINE STARTED")
    logger.info(f">> Start time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Step 1: Fetch RSS feeds
    rss_success = run_rss_fetcher()
    
    # Step 2: Process with AI (even if RSS fails, process any existing articles)
    ai_success = run_ai_processor()
    
    # Final summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print_header("PIPELINE COMPLETE")
    logger.info(f">> End time: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f">> Duration: {duration:.1f} seconds")
    logger.info(f">> RSS Fetcher: {'[OK] Success' if rss_success else '[ERROR] Failed'}")
    logger.info(f">> AI Processor: {'[OK] Success' if ai_success else '[ERROR] Failed'}")
    
    if rss_success and ai_success:
        logger.info("\n[SUCCESS] Pipeline completed successfully!")
        logger.info(">> Log saved to: " + log_filename)
        logger.info(">> Next run in 5 hours\n")
    else:
        logger.info("\n[WARNING] Pipeline completed with errors - check log for details")
        logger.info(">> Log saved to: " + log_filename + "\n")
    
    print_header("END")


if __name__ == "__main__":
    main()