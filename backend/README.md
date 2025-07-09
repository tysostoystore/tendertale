

## Рекомендованная структура для масштабирования

**Для будущих сцен и ассетов рекомендуется следующая организация:**

```
backend/
  scenes/
    prologue/
      scene_1.json
      scene_2.json
    train/
      journey_1.json
      journey_2.json
    dacha/
      arrival.json
      day1.json
  characters/
    alice.json
    emily.json
```

- **scenes/** — сцены, разбитые по папкам (глава, локация, акт). Старые файлы можно оставить в корне, новые — складывать по папкам.
- **characters/** — отдельные файлы с описанием персонажей и их спрайтов (создавать по мере необходимости).

### Пример структуры файла сцены

```json
{
  "id": "scene_1",
  "title": "Встреча у Алисы",
  "background": "bg_alice_room.png",
  "music": "calm_theme.mp3",
  "characters": [
    { "id": "alice", "sprite": "alice_sad.png", "position": "left" }
  ],
  "dialogue": [
    { "speaker": "alice", "text": "Ну наконец-то... Измучилась тебя ждать!" },
    { "speaker": "alice", "text": "Поезд через 20 минут. Опоздаем же!" },
    { "command": "change_sprite", "character": "alice", "sprite": "sad.png" },
    { "speaker": "", "text": "(Алиса выглядит очень недовольной. Кажется, ей совсем не хочется ехать...)" },
    { "speaker": "alice", "text": "Почему мы вообще должны ехать? Там же будет так ску-у-учно!" }
  ],
  "choices": [
    { "text": "Хватит ныть, каникулы же!", "next_scene": "scene_2", "condition": null },
    { "text": "Да ладно, будет весело! (Наверное...)", "next_scene": "scene_3", "condition": null },
    { "text": "Понимаю... Мне тоже не особо хочется.", "next_scene": "scene_4", "condition": null }
  ],
  "flags_set": [],
  "flags_required": []
}
```

---

**Важно:**
- Необязательно сразу переносить старые сцены — просто новые складывай по папкам.
- Для ассетов (картинок, музыки) используй `frontend/public/assets/`.
- Для персонажей можно завести отдельную папку `characters/` в backend.
- Документируй новые поля и структуру в этом README. 


## Карта перемещения сцен

- prologue/
  - scene_1.json
  - scene_2.json
  - scene_3.json
  - scene_4.json
- journey/
  - journey_1.json
  - journey_2.json
  - journey_3.json
  - journey_4.json
  - journey_5.json
- station/
  - scene_5.json
  - station_arrival_train_headphones.json
  - station_arrival_train_talk.json
- train/
  - train_journey.json
- dacha/
  - dacha_arrival.json

**Все next_scene останутся прежними, так как используются id, а не относительные пути.**

Если структура устраивает — приступаю к реальному переносу файлов. 