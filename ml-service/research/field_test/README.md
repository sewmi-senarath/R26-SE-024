# Field test at the dementia care centre (2026-10-20)

**Setting:** one resident (with consent, under staff supervision) used the app on a phone with
the researcher. 13 photos and 16 short videos were recorded on the veranda of the centre.
The care centre does not allow photographing residents' families, so family recognition was
tested with two volunteers (a friend and a staff member) enrolled as "family".

The photos and videos are **not** in this repository (they show a real resident).

## Method

- Every photo and one frame every 2 seconds of every video were run through the live detector
  (`/detect-live`: fine-tuned YOLO11s items model + YOLOv8n COCO + YOLO-World extras),
  exactly as the app uses it: 223 frames in total.
- A sample of 88 frames (all 13 photos + every third video frame) was checked by eye by the
  researcher: each detection marked correct or wrong; clearly visible objects that were not
  detected were counted as missed.

## Results (88 checked frames, 197 detections)

| Class | Detections | Correct | Precision | Notes |
|---|---|---|---|---|
| person | 106 | 99 | 93% | errors: small boxes on people shown on the phone screen, duplicate boxes |
| cell phone | 43 | 42 | 98% | 1 duplicate box; **4 visible phones missed** (recall about 91%) |
| footwear ("slippers") | 15 | 15 | 100% | shoes of the visitor, also small ones at the edge of the frame |
| potted plant | 14 | 14 | 100% | |
| hat / cap | 7 | 7 | 100% | |
| chair | 4 | 4 | 100% | |
| laptop | 3 | 3 | 100% | |
| other (wallet, remote, cup, glasses, bed, parking meter) | 6 | 0 | 0% | phone held in the hand read as wallet / remote / cup; glasses on a face mask; "bed" on the resident's dress |
| **All** | **197** | **184** | **93.4%** | |

## What this shows

- In a real, bright, moving setting the detector is reliable for people and phones (93-98 %).
- **Class confusion:** a phone held in the hand was 3 times read as another small item (wallet,
  remote, cup). This matches the test-set result (similar small rectangular items) and is the
  reason for training round 2 (more phones, wallets, bottles, books, spectacles, hard negatives).
- **Limitation:** the resident's own small items (keys, medicine, glasses, wallet) appear in very
  few frames, so this field test mainly measures people / phone / furniture. A planned second
  session records the resident's own items with the room camera.
- Frame-level checking was done by the researcher only (one rater).
