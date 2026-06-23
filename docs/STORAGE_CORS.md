# Storage CORS 설정 (LQIP 백필용)

기존 업로드 이미지에 블러(LQIP)를 일괄 생성하는 **백필 기능**(admin → 설정 → "기존 이미지 블러 백필")은
브라우저 Canvas로 원격 이미지를 읽는다. 이때 Firebase Storage 버킷에 **CORS 설정**이 없으면
canvas가 tainted 되어 블러 생성이 실패한다(해당 이미지는 "실패"로 집계되고 나머지는 계속 진행).

> 신규 업로드 경로는 로컬 File을 읽으므로 CORS와 무관하다. CORS는 **백필에만** 필요하다.

## 적용 방법

1. 버킷 이름 확인 (예: `portfolio-nhb.appspot.com` 또는 `portfolio-nhb.firebasestorage.app`).
2. 저장소 루트의 [`storage.cors.json`](../storage.cors.json)의 `origin`을 실제 admin 도메인에 맞게 확인/수정.
3. `gsutil`로 적용:

```bash
gsutil cors set storage.cors.json gs://<버킷이름>
# 예: gsutil cors set storage.cors.json gs://portfolio-nhb.appspot.com
```

4. 적용 확인:

```bash
gsutil cors get gs://<버킷이름>
```

5. admin(설정 페이지)에서 백필 실행. 실패 수가 0이면 정상.

## 주의

- `gsutil`은 Google Cloud SDK에 포함. 미설치 시 `gcloud` 설치 후 `gcloud auth login`.
- CORS는 백필을 1회 돌리기 위해서만 필요하므로, 백필 완료 후 origin을 좁혀도 무방하다.
- 백필은 멱등(idempotent): 이미 블러가 있는 이미지는 건너뛰므로 안전하게 재실행할 수 있다.
