# Práctica de MongoDB y Mongoose

API REST hecha con **Node.js, Express y Mongoose** (MongoDB local, visto con Compass). Implementa 4 colecciones relacionadas entre sí, un CRUD completo de cada una, eliminación lógica y en cascada, y validaciones con **express-validator**.

**Autor:** Soria Maximiliano

---

## 1. Cómo instalar y correr el proyecto

```bash
npm install
npm run dev
```

Requisitos:

- Node.js 20.6 o superior
- MongoDB corriendo en la PC (por defecto en el puerto `27017`)

Si todo está bien, la consola muestra:

```
Conexión exitosa a la base de datos
Servidor listo en el puerto 3005
```

> `npm run dev` ejecuta `node --watch app.js`, así que el servidor **se reinicia solo** cada vez que guardás un archivo.

**Configuración:**

- La conexión a MongoDB está definida en `src/config/database.js`. El nombre de la base que figura ahí es el que se crea (y se usa) automáticamente.
- El puerto sale de `process.env.PORT` y, si no está definido, usa `3005`.
- El `.env` es **opcional**: si querés fijar el puerto, creá un archivo `.env` en la **raíz** del proyecto con `PORT=4000`. La referencia de qué variables existen está en `src/.env.example`.
- El `.env` **no se sube** a GitHub (está en el `.gitignore`). Lo que se sube es el `.env.example`, que solo muestra qué variables hay que definir.

---

## 2. Estructura del proyecto

```
app.js                       -> arranca el servidor y monta las rutas
src/
  config/database.js         -> conexión a MongoDB con Mongoose
  models/                    -> esquemas (cómo se guarda cada dato)
  controllers/               -> lógica de cada operación (CRUD)
  routes/                    -> define las URLs y qué controlador responde
  middlewares/               -> validaciones y manejo de errores de validación
```

Se usan **ESModules** (`import` / `export`) en todo el proyecto.

### Cómo viaja un request

Todo request recorre el mismo camino:

```
Request -> Ruta -> Validador (express-validator) -> validarCampos -> Controlador -> MongoDB -> Respuesta
```

1. La **ruta** recibe la URL (por ejemplo `POST /api/tasks`).
2. El **validador** revisa los datos: tipos, largos, IDs válidos, si existen los documentos relacionados.
3. **`validarCampos`** es un middleware reutilizable: si hubo errores, corta y responde `400` con la lista de errores. Si no, deja pasar.
4. El **controlador** usa `matchedData(req)` para trabajar solo con los datos que pasaron la validación, y habla con la base.
5. Todo controlador tiene `try/catch`: si algo inesperado falla, responde `500`.

### Códigos HTTP usados

| Código | Cuándo |
|---|---|
| `201` | Se creó algo (documento nuevo o vínculo nuevo) |
| `200` | Consulta, actualización o eliminación exitosa |
| `400` | Error de validación |
| `404` | El documento buscado no existe (o está eliminado) |
| `500` | Error inesperado del servidor |

---

## 3. Colecciones

### User

| Campo | Detalle |
|---|---|
| `nombre` | Texto obligatorio, 2 a 50 caracteres |
| `email` | Obligatorio, único (índice parcial), en minúsculas |
| `activo` | `true` por defecto. Sirve para la eliminación lógica |

### Profile

| Campo | Detalle |
|---|---|
| `user` | Referencia a User. Obligatorio y **único** entre perfiles activos (relación 1:1) |
| `bio`, `telefono` | Texto opcional |
| `direccion` | **Propiedad embebida**: `calle`, `ciudad`, `codigoPostal` |
| `activo` | Eliminación lógica |

### Task

| Campo | Detalle |
|---|---|
| `titulo` | Obligatorio, 3 a 100 caracteres |
| `descripcion` | Opcional, hasta 500 caracteres |
| `estado` | `pendiente`, `en_progreso` o `completada` |
| `user` | Referencia a User (relación 1:N) |
| `tags` | Array de referencias a Tag (relación N:M) |
| `activo` | Eliminación lógica |

### Tag

| Campo | Detalle |
|---|---|
| `nombre` | Obligatorio, único (índice parcial), en minúsculas, 2 a 30 caracteres |
| `descripcion` | Opcional, hasta 150 caracteres |
| `activo` | Eliminación lógica |

### Mapa de relaciones

```
User  1 ---- 1  Profile      (Profile guarda el user)
User  1 ---- N  Task         (Task guarda el user)
Task  N ---- M  Tag          (Task guarda el array de tags)
Profile contiene direccion   (embebida)
```

---

## 4. Embebido vs. referenciado: por qué elegí cada uno

**Propiedad embebida: `direccion` dentro de `Profile`.**
La dirección siempre se lee junto con el perfil, nunca se consulta sola y no la comparte ninguna otra colección. Es un dato chico que "pertenece" a un solo perfil, así que guardarlo adentro evita una colección extra y una consulta más. Es un subesquema con `_id: false` porque no necesita identificarse por separado.

**Relación 1:1: `Profile` -> `User` (referenciada).**
Un usuario puede existir sin perfil, pero un perfil no tiene sentido sin usuario. Por eso la referencia va del lado de Profile (`user`). Se marca como único (con índice parcial, ver §5.2) para que un usuario no pueda tener dos perfiles activos. Se mantienen separados porque el perfil tiene datos opcionales y más pesados, y no hace falta cargarlos cada vez que se consulta un usuario.

**Relación 1:N: `Task` -> `User` (referenciada).**
Un usuario puede tener muchísimas tareas, y las tareas crecen y cambian todo el tiempo. Si fueran un array dentro de User, el documento crecería sin límite y habría que reescribirlo cada vez. Poniendo la referencia del lado "muchos" (`Task.user`), cada tarea es independiente y se consulta, actualiza o elimina por su cuenta.

**Relación N:M: `Task.tags` (array de referencias).**
Una tarea tiene varias etiquetas y una etiqueta está en varias tareas. Guardé el array **solo en Task** (no en Tag, ni en los dos). Si estuviera en los dos lados habría que mantener dos arrays sincronizados, y ante un error podrían quedar inconsistentes. Con un solo lado, la "verdad" está en un único lugar, y desde Tag se ven sus tareas con virtual populate.

---

## 5. Investigación

La consigna pedía investigar 3 puntos. Resumen de cada uno y dónde está la explicación completa:

| # | Punto a investigar | Respuesta corta | Detalle |
|---|---|---|---|
| 1 | **Virtual populate**: cómo `User` y `Tag` traen sus tareas sin guardar referencias (`localField`, `foreignField`, `toJSON: { virtuals: true }`) | Se declara un virtual que le dice a Mongoose en qué colección buscar y con qué campo cruzar. `User` no guarda nada: el virtual apunta a `Task` comparando `localField: '_id'` contra `foreignField: 'user'`. Hay que activar `toJSON: { virtuals: true }`, si no el campo no sale en el JSON. | §5.1 |
| 2 | **Eliminación lógica y cascada**: flag `activo`, filtros en los `find`, y `updateMany` en el controlador para desactivar perfil y tareas (o `$pull` para quitar la etiqueta) | Nunca se borra el documento, solo se pone `activo: false`. Todas las consultas filtran por `activo: true`. Al eliminar un `User`, el controlador hace `updateMany` sobre su `Profile` y sus `Task`; al eliminar un `Tag`, `$pull` lo saca del array `tags` de cada tarea. | §5.2 |
| 3 | **N:M con `$addToSet`**: por qué no `$push`, y por qué además hay un `custom()` | `$push` agrega siempre y dejaría el mismo ID repetido ante dos requests iguales; `$addToSet` solo agrega si todavía no está. Pero `$addToSet` falla **en silencio**, por eso el `custom()` verifica que la tarea exista, que la etiqueta exista y que el vínculo no esté ya creado, y responde `400` con un mensaje claro. | §5.3 |

### 5.1 Populate: normal y virtual

#### Populate normal

Se usa cuando **la referencia está en el documento que estoy consultando**. Trae el dato de la otra colección y lo "incrusta" en la respuesta.

```javascript
// Task guarda el user, así que Task puede popularlo y elegir qué campos traer
Task.find().populate("user", "nombre email").populate("tags", "nombre");
```

La firma es `.populate(ruta, select)`:

- **1er argumento**: qué campo popular (obligatorio).
- **2do argumento** *(opcional)*: **qué campos traer**, no otra ruta.

> ⚠️ Si querés popular **dos rutas**, no pongas dos strings: el segundo se leería como un "select" y la segunda ruta nunca se poblaría (sin error, en silencio). Se hace con un **array** o encadenando:
>
> ```javascript
> User.find().populate(["profile", "tasks"]);          // array de rutas
> User.find().populate("profile").populate("tasks");   // encadenado
> User.find().populate({ path: "tasks", select: "titulo estado" });  // select por ruta
> ```

#### Populate virtual (desde la colección que NO tiene la referencia)

`User` no guarda a sus tareas ni a su perfil, y `Tag` no guarda sus tareas. Aun así, podemos traerlos con un **virtual**: un campo que no existe en la base, pero que Mongoose calcula buscando en la otra colección.

```javascript
userSchema.virtual('tasks', {
  ref: 'Task',            // en qué colección buscar
  localField: '_id',      // campo de User que se compara...
  foreignField: 'user',   // ...con este campo de Task
  match: { activo: true } // solo tareas no eliminadas
});
```

Se lee así: "buscá las tareas cuyo `user` sea igual al `_id` de este usuario". Después se usa como cualquier populate: `User.find().populate('tasks')`.

Hay que activar `toJSON: { virtuals: true }` y `toObject: { virtuals: true }` en el esquema, si no, el virtual no aparece en las respuestas JSON.

En `Tag` el virtual usa `foreignField: 'tags'`. Como `Task.tags` es un array, Mongoose busca las tareas cuyo array contenga el `_id` de la etiqueta.

Se usó en: `User -> profile`, `User -> tasks` y `Tag -> tasks`.

> ⚠️ **Regla importante:** los virtuals se declaran **antes** de `model()`. Si se declaran después, Mongoose los pobla en memoria pero **no los serializa**: `tag.tasks` devuelve las tareas, pero el JSON de la respuesta no las trae, y no aparece ningún error. Es un fallo silencioso.

#### Comparación rápida

| | Populate normal | Populate virtual |
|---|---|---|
| ¿Dónde está la referencia? | En el documento que consulto | En el **otro** lado |
| Ejemplo | `Task -> user` | `User -> tasks`, `Tag -> tasks` |
| Uso | `.populate("user")` | `.populate("tasks")` |
| Elegir campos | `.populate("user", "nombre email")` | `.populate({ path: "tasks", select: "titulo" })` |
| Requiere `toJSON.virtuals` | No | **Sí** |

### 5.2 Eliminación lógica y en cascada

**Lógica:** no se borra el documento, solo se marca `activo: false`. El dato sigue en la base (se puede recuperar o auditar), pero la API lo trata como inexistente. Para que funcione, **todas las consultas filtran** por `activo: true`.

```javascript
await User.findOneAndUpdate({ _id: id, activo: true }, { activo: false });
```

**En cascada:** cuando se elimina un documento "padre", los hijos que dependen de él también se desactivan, para que no queden tareas o perfiles huérfanos. Se hace en el controlador:

| Al eliminar... | Pasa esto |
|---|---|
| un **User** | Se desactivan su `Profile` y todas sus `Task` (`updateMany`) |
| un **Tag** | Se quita de `Task.tags` en todas las tareas que lo tenían (`$pull`) |

```javascript
await Profile.updateMany({ user: id }, { activo: false });
await Task.updateMany({ user: id }, { activo: false });
await Task.updateMany({ tags: id }, { $pull: { tags: id } });
```

Se eligió hacerlo en el controlador (en vez de hooks `pre`/`post` de Mongoose) porque queda visible y fácil de seguir.

#### La trampa del `unique` con borrado lógico

Un `unique: true` normal **no sabe nada del borrado lógico**: sigue ocupando el valor aunque el documento esté en `activo: false`. Si no se hiciera nada, al borrar una etiqueta quedaría **imposible volver a crear una con ese nombre**, y lo mismo con el email de un usuario.

Además, agregar `activo: true` **solo en el validador** no alcanza: el validador dejaría pasar el request y **MongoDB lo rechazaría** con un error `E11000` (500).

La solución es un **índice único parcial**: el índice solo se aplica **entre los documentos activos**.

```javascript
tagSchema.index(
  { nombre: 1 },
  { unique: true, partialFilterExpression: { activo: true } },
);
```

Resultado:

| Escenario | ¿Pasa? |
|---|---|
| Crear una etiqueta nueva | ✅ 201 |
| Crear otra con el mismo nombre **estando la primera activa** | ❌ 400 |
| Borrar la primera y volver a crear el mismo nombre | ✅ 201 |

Lo mismo se aplicó en `email` de **User** y en `user` de **Profile** (relación 1:1).

> Los índices los crea Mongoose solo al arrancar. Si cambiás un índice en el código, hay que borrar el viejo en Compass/mongosh (`db.tags.dropIndex("nombre_1")`) para que se genere el nuevo.

### 5.3 Endpoint para agregar un vínculo en la relación N:M

```
POST /api/tasks/:id/tags/:tagId
```

Agrega la etiqueta `tagId` a la tarea `id` usando **`$addToSet`**:

```javascript
await Task.findOneAndUpdate(
  { _id: id, activo: true },
  { $addToSet: { tags: tagId } },
  { returnDocument: "after" }
);
```

- `$push` agrega siempre: dos requests seguidos dejarían el mismo ID repetido.
- `$addToSet` agrega el valor **solo si todavía no está** en el array.
- `returnDocument: "after"` hace que devuelva el documento **ya actualizado** (era `{ new: true }`, deprecado en Mongoose 9).

Además de `$addToSet`, el validador comprueba con `custom()`:

1. que la tarea exista y esté activa,
2. que la etiqueta exista y esté activa,
3. que el vínculo no esté ya creado (si lo está, devuelve `400` con un mensaje claro).

`$addToSet` protege la base en silencio, y el `custom()` le da al usuario un error entendible.

> 📌 **Límite actual:** por ahora solo existe el vínculo (`POST`). No hay endpoint para desvincular: para quitar una etiqueta de una tarea hay que eliminar la etiqueta (la cascada la saca de todas las tareas con `$pull`).

---

## 6. Validaciones (express-validator)

- Campos obligatorios, tipos de datos y longitudes en todas las rutas de creación y actualización.
- Campos de la propiedad embebida (`direccion.calle`, `direccion.ciudad`, `direccion.codigoPostal`).
- IDs de la URL y del body validados con `isMongoId()`.
- `custom()` para verificar que existan los documentos relacionados (`user`, `tags`) y evitar duplicados (email de User, nombre de Tag, perfil repetido para un usuario, vínculo repetido en la N:M).
- Un único middleware `validarCampos` con `validationResult()` que devuelve los errores con código `400`.
- `matchedData()` en los controladores: solo se usan los datos validados.

---

## 7. Endpoints

Base: `http://localhost:3005`

### Users — `/api/users`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/users` | Crear usuario |
| GET | `/api/users` | Listar usuarios activos (con `profile` y `tasks`) |
| GET | `/api/users/:id` | Obtener un usuario |
| PUT | `/api/users/:id` | Actualizar |
| DELETE | `/api/users/:id` | Eliminar (lógica + cascada a Profile y Task) |

### Profiles — `/api/profiles`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/profiles` | Crear perfil (un usuario solo puede tener uno) |
| GET | `/api/profiles` | Listar perfiles (con `user`) |
| GET | `/api/profiles/:id` | Obtener un perfil |
| PUT | `/api/profiles/:id` | Actualizar (incluida la dirección) |
| DELETE | `/api/profiles/:id` | Eliminación lógica |

### Tasks — `/api/tasks`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/tasks` | Crear tarea (con `user` y opcionalmente `tags`) |
| GET | `/api/tasks` | Listar tareas (con `user` y `tags`) |
| GET | `/api/tasks/:id` | Obtener una tarea |
| PUT | `/api/tasks/:id` | Actualizar |
| DELETE | `/api/tasks/:id` | Eliminación lógica |
| POST | `/api/tasks/:id/tags/:tagId` | **N:M:** vincular una etiqueta a la tarea |

### Tags — `/api/tags`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/tags` | Crear etiqueta |
| GET | `/api/tags` | Listar etiquetas (con `tasks`) |
| GET | `/api/tags/:id` | Obtener una etiqueta |
| PUT | `/api/tags/:id` | Actualizar |
| DELETE | `/api/tags/:id` | Eliminar (lógica + se quita de las tareas) |

### Ejemplos de body

Crear usuario:

```json
{ "nombre": "Maxi", "email": "maxi@mail.com" }
```

Crear perfil con dirección embebida:

```json
{
  "user": "<id del usuario>",
  "bio": "Estudiante del IPF",
  "telefono": "3704123456",
  "direccion": { "calle": "Belgrano 123", "ciudad": "Formosa" }
}
```

Crear etiqueta:

```json
{ "nombre": "urgente", "descripcion": "Tareas prioritarias" }
```

Crear tarea con etiquetas:

```json
{
  "titulo": "Estudiar Mongoose",
  "user": "<id del usuario>",
  "tags": ["<id tag 1>", "<id tag 2>"]
}
```

---

## 8. Cómo probarlo (Postman)

1. Levantá el servidor con `npm run dev`.
2. En Postman: **Headers** → `Content-Type: application/json`.
3. Para crear: **Body → raw → seleccionar JSON** en el menú desplegable.

### Recorrido feliz completo

| # | Método | URL | Body | Esperado |
|---|---|---|---|---|
| 1 | POST | `/api/users` | `{"nombre":"Maxi","email":"maxi@mail.com"}` | `201` |
| 2 | POST | `/api/profiles` | `{"user":"<id del user>"}` | `201` |
| 3 | POST | `/api/tags` | `{"nombre":"urgente"}` | `201` |
| 4 | POST | `/api/tasks` | `{"titulo":"Estudiar Mongoose","user":"<id user>"}` | `201` |
| 5 | POST | `/api/tasks/<id task>/tags/<id tag>` | *(sin body)* | `201` |
| 6 | GET | `/api/tasks/<id task>` | — | `200` con `user` y `tags` poblados |
| 7 | GET | `/api/users/<id user>` | — | `200` con `profile` y `tasks` |
| 8 | GET | `/api/tags/<id tag>` | — | `200` con `tasks` |

> **De dónde saco los IDs:** del campo `_id` de la respuesta de cada `POST`, o listando con `GET /api/...` y mirando en Compass.

### Casos de error que conviene probar

| Qué mandás | Qué responde |
|---|---|
| `POST /api/users` sin `email` | `400` con la lista de errores |
| `POST /api/users` con un email ya existente | `400` "Ya existe un usuario con ese email" |
| `POST /api/tasks` con `titulo` de 2 letras | `400` "El título debe tener entre 3 y 100 caracteres" |
| `POST /api/tasks` con un `user` inexistente | `400` "El usuario no existe" |
| `POST /api/tasks/<id>/tags/<id>` repetido | `400` "La etiqueta ya está vinculada a esta tarea" |
| `GET /api/tasks/<id>` de una tarea borrada | `404` "Tarea no encontrada" |
| Un body con JSON malformado | `400` de Express (no llega al validador) |

---

## 9. Errores que encontré y cómo los resolví

Esta fue la parte más educativa de la práctica: ninguno de estos errores "avisa", hay que leer el mensaje y entender por qué pasa.

| Error | Causa real | Solución |
|---|---|---|
| `Cannot find package 'cookie-parser'` | Tras clonar no existía `node_modules`, y esa carpeta **no viaja en Git** (está en `.gitignore`) | `npm install` |
| `ReferenceError: validarVinculoTag is not defined` | Se usaba el validador en la ruta pero **faltaba el `import`** | Agregarlo al bloque de imports del archivo de rutas |
| `.populate("profile", "tasks")` no traía las tareas | El **2do argumento de `populate` es un "select"** (qué campos mostrar), no una segunda ruta. Nunca dio error, simplemente no populaba | `.populate(["profile", "tasks"])` |
| El virtual existía pero no aparecía en el JSON | El `virtual()` estaba declarado **después** de `model()`: Mongoose lo pobla en memoria pero no lo serializa | Mover el `virtual()` **antes** de `model()` |
| `POST /api/profiles` devolvía `500` pidiendo `direccion.calle` | `matchedData()` inyecta las rutas anidadas del validador aunque no vengan en el body: llegaba `direccion: { calle: undefined, ciudad: undefined }` | Descartar `direccion` si no tiene contenido |
| No se podía recrear un nombre/email borrado | `unique: true` normal también cubre los documentos **borrados lógicamente**; y solo arreglarlo en el validador no bastaba, porque MongoDB lo rechazaba igual (`E11000`) | Índice único **parcial** con `partialFilterExpression: { activo: true }` |
| `git pull` metió todas las ramas en `main` | `git pull origen X` **fusiona X dentro de la rama en la que estás parado** | Usar `git fetch` + `git checkout <rama>`, y nunca traer otra rama estando en `main` |

---

## 10. Problemas comunes al correrlo

| Síntoma | Causa probable |
|---|---|
| `Cannot find package 'x'` | Falta `npm install` |
| `Error al conectar a la base de datos` | MongoDB no está corriendo en el puerto `27017` |
| `EADDRINUSE` / no levanta | El puerto 3005 ya está ocupado (otra instancia de `npm run dev`) |
| Respuesta `400` con "El ID no es un ObjectId válido" | El `:id` de la URL no tiene 24 caracteres hexadecimales |
| El dato aparece en Compass pero no en la API | No cumple `activo: true`: todos los `GET` filtran por eso |

---

## 11. Control de versiones

- Se trabajó en la rama `mongoose-basico`, creada a partir de `develop`.
- Commits chicos y descriptivos (config, modelos, CRUD de cada colección, endpoint N:M, README).
- Al terminar: merge de `mongoose-basico` a `develop`, y de `develop` a `main`.
