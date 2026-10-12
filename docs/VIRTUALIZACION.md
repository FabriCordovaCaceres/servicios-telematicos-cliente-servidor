# Guía de virtualización — Entorno de pruebas distribuido

Guía paso a paso para construir el entorno virtualizado donde se despliegan y prueban los tres prototipos del proyecto (**Cliente-Servidor**, **P2P** y **Microservicios**) sobre una red real entre máquinas.

> Proyecto: *Comparación de Arquitecturas Distribuidas: Sistema Colaborativo de Gestión de Tareas* — Grupo 10, Servicios Telemáticos, UMSS.

---

## Tabla de la topología

| VM | Hostname | IP Host-Only | Contenedor | Imagen | Puerto | Variables |
|---|---|---|---|---|---|---|
| VM1 | vm1-cs-p2p | 192.168.56.11 | tele-cs | tele-cliente-servidor | 3000 | — |
| VM1 | vm1-cs-p2p | 192.168.56.11 | tele-p2p-1 | tele-p2p | 4001 | `PORT=4001`, `NODE_ID=nodo-1` |
| VM2 | vm2-p2p-micro | 192.168.56.12 | tele-p2p-2 | tele-p2p | 4002 | `PORT=4002`, `NODE_ID=nodo-2` |
| VM2 | vm2-p2p-micro | 192.168.56.12 | tele-micro-tareas | tele-microservicios | 5001 | — |

### ¿Por qué cada VM tiene dos tarjetas de red?

| Tarjeta | Tipo en VirtualBox | Nombre en Ubuntu | Para qué sirve |
|---|---|---|---|
| Adaptador 1 | **NAT** | `enp0s3` (IP `10.0.2.15`) | Salida a **internet** (instalar paquetes, clonar de GitHub) |
| Adaptador 2 | **Solo-anfitrión (Host-Only)** | `enp0s8` (IP fija) | Que **VM1, VM2 y la PC se vean entre sí** |

En VirtualBox, el modo NAT aísla a cada VM: con solo NAT, VM1 y VM2 **no podrían comunicarse**. Por eso se añade la red Host-Only.

> Ambas VMs tienen `10.0.2.15` en `enp0s3`. **Es normal**: cada VM tiene su propia red NAT privada y no chocan.

### Recursos de cada VM

| Recurso | Valor |
|---|---|
| Sistema operativo | Ubuntu Server 24.04.5 LTS (sin interfaz gráfica) |
| CPU | 2 vCPU |
| RAM | 2048 MB |
| Disco | 25 GB (dinámico) |
| Usuario | `grupo10` |

Ambas VMs tienen **los mismos recursos** para no sesgar las pruebas de rendimiento.

---

## 1. Requisitos

### En tu PC

| Requisito | Cómo comprobarlo |
|---|---|
| Windows 10 u 11 | — |
| **Virtualización activada** en BIOS | Administrador de tareas (`Ctrl+Shift+Esc`) → Rendimiento → CPU → **"Virtualización: Habilitado"**. Si dice *Deshabilitado*, actívala en la BIOS (Intel VT-x o AMD SVM). |
| **8 GB de RAM** o más | Administrador de tareas → Rendimiento → Memoria |
| **50 GB libres** en disco | Explorador → Este equipo |

### Software a descargar

| Software | Enlace |
|---|---|
| VirtualBox 7.x | https://www.virtualbox.org/wiki/Downloads → *Windows hosts* |
| ISO de Ubuntu Server 24.04.5 LTS (3.8 GB) | https://releases.ubuntu.com/24.04/ubuntu-24.04.5-live-server-amd64.iso |

---

## 2. Paso 1 — Crear la red Host-Only en VirtualBox

1. Abre VirtualBox → menú **Archivo → Herramientas → Administrador de red** (atajo `Ctrl + H`).
2. Pestaña **Redes solo-anfitrión** (*Host-only Networks*).
   - Si ya existe **"VirtualBox Host-Only Ethernet Adapter"** con **192.168.56.1/24**, ve al punto 4.
   - Si la lista está vacía, haz clic en **Crear** y acepta el permiso de Windows. Espera 10–30 segundos.
     > Si da error, ejecuta VirtualBox **como administrador** y vuelve a intentar.
3. Selecciona la red y haz clic en **Propiedades**.
4. Pestaña **Adaptador** → marca **Configurar adaptador manualmente**:

   | Campo | Valor |
   |---|---|
   | Dirección IPv4 | `192.168.56.1` |
   | Máscara de red IPv4 | `255.255.255.0` |

5. Pestaña **Servidor DHCP** → **desmarca "Habilitar servidor"**.
   *Motivo:* las IPs de las VMs se ponen fijas a mano para que sean siempre las mismas.
6. Clic en **Aplicar**.
---

## 3. Paso 2 — Crear VM1 e instalar Ubuntu Server

### 3.1 Crear la máquina

En VirtualBox → **Nueva**:

| Sección | Campo | Valor |
|---|---|---|
| Nombre y SO | Nombre | `VM1-CS-P2P` |
| | Imagen ISO | `ubuntu-24.04.5-live-server-amd64.iso` |
| | Tipo / Versión | Linux / Ubuntu (64-bit) (se llena solo) |
| | **Omitir instalación desatendida** | ✅ **Marcado** |
| Hardware | Memoria base | `2048 MB` |
| | Procesadores | `2` |
| | Habilitar EFI | ❌ Sin marcar |
| Disco duro | Crear disco ahora | `25 GB`, **sin** pre-asignar |

→ **Terminar**. **No la enciendas todavía.**

### 3.2 Configurar la red de la VM

Selecciona VM1 → **Configuración → Red**:

| Adaptador | Habilitado | Conectado a | Nombre |
|---|---|---|---|
| Adaptador 1 | ✅ | **NAT** | — |
| Adaptador 2 | ✅ **(márcalo)** | **Adaptador solo-anfitrión** | VirtualBox Host-Only Ethernet Adapter (la del Paso 1) |

En el Adaptador 2 → **Avanzadas** → ✅ **Cable conectado**. → **Aceptar**.

### 3.3 Instalar Ubuntu Server

Selecciona VM1 → **Iniciar**.

| # | Pantalla | Qué hacer |
|---|---|---|
| 1 | Menú GRUB | **Try or Install Ubuntu Server** → Enter. Espera 1–2 min. |
| 2 | Idioma | **English** (recomendado: los errores en inglés son más fáciles de buscar) o Español |
| 3 | *Installer update* (puede no aparecer) | **Continue without updating** |
| 4 | Teclado | Layout y Variant: **Spanish (Latin American)** (o *Spanish* si tu teclado es de España). ⚠️ Revísalo bien: si queda mal, no podrás escribir `\|`, `/`, `-`, `~` |
| 5 | Tipo de instalación | **(X) Ubuntu Server** (⚠️ **no** la *minimized*). No marques *third-party drivers* |
| 6 | Red | `enp0s3` debe tener `10.0.2.15`. `enp0s8` aparecerá **sin IP** → **es normal**, no la toques |
| 7 | Proxy | Vacío |
| 8 | Mirror | Espera *"This mirror location passed tests"* |
| 9 | Almacenamiento | **(X) Use an entire disk** y **desmarca "Set up this disk as an LVM group"** (con LVM Ubuntu puede usar solo la mitad del disco) |
| 10 | Resumen de disco | **Done** → **Continue** (solo borra el disco virtual, no tu PC) |
| 11 | Perfil | Your name: `Grupo 10` · Server's name: `vm1-cs-p2p` · Username: `grupo10` · Password: la acordada por el grupo |
| 12 | Ubuntu Pro | **Skip for now** |
| 13 | SSH | ⚠️ Marca **[X] Install OpenSSH server** (con Espacio) y deja **Allow password authentication** |
| 14 | Featured snaps | **No marques nada** (⚠️ especialmente **no** el snap de docker) |
| 15 | Instalación | Espera 5–20 min → **Reboot Now** |
| 16 | *Remove installation medium* | Enter. Si vuelve a salir el instalador: *Dispositivos → Unidades ópticas → Eliminar disco* y reinicia |

### 4.4 Primer inicio de sesión

Cuando aparezca `vm1-cs-p2p login:` (si salen mensajes de *cloud-init* encima, presiona **Enter**):

- Usuario: `grupo10`
- Contraseña: la tuya (**no se ve nada al escribirla, es normal**)

---

## 4. Paso 3 — Configurar DNS e IP fija en VM1

### 4.1 Confirmar el nombre de las tarjetas

```bash
ip -br a
```

Esperado:

```
lo       UNKNOWN   127.0.0.1/8 ::1/128
enp0s3   UP        10.0.2.15/24 ...
enp0s8   DOWN
```

Si tu tarjeta Host-Only tiene otro nombre (no `enp0s8`), usa **ese nombre** en el archivo del punto 4.3.

### 4.2 Archivo de DNS (evita el error *"Temporary failure in name resolution"*)

Con la red NAT de VirtualBox a veces la VM tiene internet pero no puede traducir nombres (`google.com`) a IPs. Le indicamos servidores DNS públicos:

```bash
sudo nano /etc/netplan/55-dns.yaml
```

Contenido:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
```

Guardar en nano: `Ctrl + O` → Enter. Salir: `Ctrl + X`.

### 4.3 Archivo de IP fija para la red Host-Only

```bash
sudo nano /etc/netplan/60-hostonly.yaml
```

Contenido:

```yaml
network:
  version: 2
  ethernets:
    enp0s8:
      dhcp4: false
      addresses:
        - 192.168.56.11/24
```

### 4.4 Aplicar y comprobar

```bash
sudo chmod 600 /etc/netplan/55-dns.yaml /etc/netplan/60-hostonly.yaml
sudo netplan apply
```

Si no sale ningún mensaje, salió bien. Comprueba:

```bash
ls /etc/netplan/
```
Deben estar **exactamente**: `50-cloud-init.yaml  55-dns.yaml  60-hostonly.yaml`

```bash
ip -br a
```
Esperado: `enp0s8   UP   192.168.56.11/24 ...`

```bash
ip route
```
Esperado (entre otras líneas):
```
default via 10.0.2.2 dev enp0s3 ...
192.168.56.0/24 dev enp0s8 ... src 192.168.56.11
```

```bash
ping -c 3 google.com
```
Esperado: 3 respuestas y `0% packet loss`.

> **¿Te equivocaste en el nombre del archivo?** Renómbralo con `sudo mv /etc/netplan/NOMBRE-MALO /etc/netplan/60-hostonly.yaml`. No dejes archivos `.yaml` extra en esa carpeta: netplan los lee todos.

---

## 5. Paso 4 — Conectarse por SSH desde Windows

### 5.1 Comprobar SSH dentro de la VM

```bash
systemctl status ssh.socket
```

Debe decir **`active (listening)`**. Sal con `q`.

> En Ubuntu 24.04 es normal que `systemctl status ssh` muestre `inactive (dead)` con `TriggeredBy: ssh.socket`: el servicio se activa automáticamente cuando alguien se conecta.

### 5.2 Conectarse desde Windows

Abre **PowerShell** (`Win + R` → `powershell`):

```powershell
ping 192.168.56.11
ssh grupo10@192.168.56.11
```

- La primera vez pregunta *"Are you sure you want to continue connecting?"* → escribe **`yes`** (completo).
- Escribe la contraseña (no se ve).
- Debes ver: `grupo10@vm1-cs-p2p:~$`

---

## 6. Paso 5 — Instalar Docker en VM1

Desde la sesión SSH de VM1. Método oficial: https://docs.docker.com/engine/install/ubuntu/

### 6.1 Actualizar Ubuntu e instalar herramientas

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git jq
```

- Si aparece una pantalla morada *"Which services should be restarted?"* → **Enter**.
- Si aparece *"Could not get lock /var/lib/dpkg/lock-frontend"*, Ubuntu está actualizándose solo en segundo plano: espera 3–5 min y repite.
- `jq` sirve para ver respuestas JSON ordenadas.

Si hace falta reiniciar:

```bash
[ -f /var/run/reboot-required ] && echo "HAY QUE REINICIAR" || echo "No hace falta reiniciar"
```

Si dice *HAY QUE REINICIAR*: `sudo reboot`, espera 40 s y vuelve a conectarte por SSH.

### 6.2 Añadir el repositorio oficial de Docker

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Copia y pega este bloque **completo** de una sola vez (desde `sudo tee` hasta `EOF`):

```bash
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

Comprueba: `cat /etc/apt/sources.list.d/docker.sources` → debe incluir `Suites: noble` y `Architectures: amd64`.

```bash
sudo apt update
```

Debe aparecer una línea con `download.docker.com`.

### 6.3 Instalar Docker

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 6.4 Usar Docker sin `sudo`

```bash
sudo usermod -aG docker $USER
exit
```

Vuelve a conectarte (`ssh grupo10@192.168.56.11`) y comprueba:

```bash
groups                       # debe incluir "docker"
docker --version
docker compose version
docker run --rm hello-world  # debe mostrar "Hello from Docker!"
sudo systemctl status docker # active (running) y enabled → q para salir
```

### 6.5 Instantánea

```bash
sudo poweroff
```

VirtualBox → VM1 → **☰ → Instantáneas → Tomar** → nombre `Docker-instalado`.

> Hazla **antes** de clonar: VM2 heredará Docker y no tendrás que reinstalarlo.

---

## 7. Paso 6 — Crear VM2 clonando VM1

### 7.1 Clonar

⚠️ **VM1 debe estar apagada.**

VirtualBox → clic derecho en **VM1-CS-P2P → Clonar** (`Ctrl + O`):

| Pantalla | Opción |
|---|---|
| Nombre | `VM2-P2P-MICRO` |
| **Política de dirección MAC** | ⚠️ **Generar nuevas direcciones MAC para todos los adaptadores de red** |
| Mantener nombres de disco / UUIDs | ❌ Sin marcar |
| Tipo de clonación | **Clonación completa** |
| Instantáneas | **Estado actual de la máquina** |


### 7.2 Revisar la red de VM2

VM2 → **Configuración → Red**: Adaptador 1 = **NAT**, Adaptador 2 = **solo-anfitrión** (la misma red que VM1) con **Cable conectado**. En *Avanzadas*, compara las **direcciones MAC** con las de VM1: **deben ser distintas**. Si no, pulsa el botón 🔄 junto a la MAC.

### 8.3 Darle identidad propia a VM2

⚠️ **VM1 sigue apagada** (VM2 todavía tiene la IP `.11`; si ambas están encendidas habrá conflicto).

Inicia **VM2 con ventana** y entra con `grupo10`. El login todavía dirá `vm1-cs-p2p`: es normal.


**1. Nombre de la máquina:**
```bash
sudo sed -i 's/vm1-cs-p2p/vm2-p2p-micro/g' /etc/hosts
sudo hostnamectl set-hostname vm2-p2p-micro
hostname        # → vm2-p2p-micro
```

**2. IP de `.11` a `.12`:**
```bash
sudo sed -i 's/192.168.56.11/192.168.56.12/' /etc/netplan/60-hostonly.yaml
sudo cat /etc/netplan/60-hostonly.yaml      # debe decir 192.168.56.12/24
sudo netplan apply
ip -br a                                    # enp0s8 → 192.168.56.12/24
```

**3. Identificador único de máquina nuevo:**
```bash
sudo rm /etc/machine-id
sudo systemd-machine-id-setup
```

**4. Llaves SSH nuevas** (para que VM2 tenga su propia "huella" SSH):
```bash
sudo rm /etc/ssh/ssh_host_*
sudo ssh-keygen -A
```

**5. Reiniciar:**
```bash
sudo reboot
```

Tras reiniciar, el login debe decir `vm2-p2p-micro login:`.

### 7.4 Comprobar VM2 por SSH

En PowerShell:

```powershell
ping 192.168.56.12
ssh grupo10@192.168.56.12
```

Escribe `yes` la primera vez. Dentro de VM2:

```bash
hostname                     # vm2-p2p-micro
ip -br a                     # enp0s8 UP 192.168.56.12/24
ping -c 3 google.com         # internet OK
docker run --rm hello-world  # Docker OK (vino con el clon)
```

Instantánea de VM2: `Base-configurada`.

---

## 9. Paso 7 — Comprobar la comunicación entre VMs

Enciende **las dos** VMs (*Inicio sin interfaz*) y abre **dos PowerShell**:

```powershell
ssh grupo10@192.168.56.11     # ventana 1 → VM1
ssh grupo10@192.168.56.12     # ventana 2 → VM2
```

> En Windows Terminal: nueva pestaña `Ctrl + Shift + T`, dividir pantalla `Alt + Shift + D`.

**En VM1:**
```bash
ping -c 4 192.168.56.12
```

**En VM2:**
```bash
ping -c 4 192.168.56.11
```

**En Windows (PowerShell sin SSH):**
```powershell
ping 192.168.56.11
ping 192.168.56.12
```

Esperado en todos: respuestas y **0% packet loss**. El valor `time=` (normalmente < 1 ms) es la **latencia base** de la red del entorno.

---

## 9. Paso 8 — Desplegar los prototipos

### 9.1 VM1 — Cliente-Servidor + P2P nodo 1

```bash
mkdir -p ~/proyecto && cd ~/proyecto
git clone https://github.com/FabriCordovaCaceres/servicios-telematicos-cliente-servidor.git
git clone https://github.com/FabriCordovaCaceres/servicios-telematicos-p2p.git
```

**Cliente-Servidor:**
```bash
cd ~/proyecto/servicios-telematicos-cliente-servidor
docker build -t tele-cliente-servidor .
docker run -d --name tele-cs --restart unless-stopped -p 3000:3000 tele-cliente-servidor
```

**P2P nodo 1:**
```bash
cd ~/proyecto/servicios-telematicos-p2p
docker build -t tele-p2p .
docker run -d --name tele-p2p-1 --restart unless-stopped -p 4001:4001 -e PORT=4001 -e NODE_ID=nodo-1 tele-p2p
```

**Comprobación:**
```bash
docker ps                                  # tele-cs y tele-p2p-1 en estado "Up"
docker logs tele-cs
docker logs tele-p2p-1
curl -s http://localhost:3000/ | jq
curl -s http://localhost:4001/ | jq
```

### 9.2 VM2 — P2P nodo 2 + Microservicio de tareas

```bash
mkdir -p ~/proyecto && cd ~/proyecto
git clone https://github.com/FabriCordovaCaceres/servicios-telematicos-p2p.git
git clone https://github.com/FabriCordovaCaceres/servicios-telematicos-microservicios.git
```

**P2P nodo 2:**
```bash
cd ~/proyecto/servicios-telematicos-p2p
docker build -t tele-p2p .
docker run -d --name tele-p2p-2 --restart unless-stopped -p 4002:4002 -e PORT=4002 -e NODE_ID=nodo-2 tele-p2p
```

**Microservicio de tareas:**
```bash
cd ~/proyecto/servicios-telematicos-microservicios
docker build -t tele-microservicios .
docker run -d --name tele-micro-tareas --restart unless-stopped -p 5001:5001 tele-microservicios
```

**Comprobación:**
```bash
docker ps                                  # tele-p2p-2 y tele-micro-tareas en "Up"
curl -s http://localhost:4002/ | jq
curl -s http://localhost:5001/health | jq
```
---

## 10. Paso 9 — Pruebas cruzadas con curl

Cada VM llama a la **IP de la otra VM**, demostrando que los servicios funcionan a través de la red. El añadido `-w "..."` muestra el código HTTP y el tiempo de respuesta.

### Bloque A — desde VM2 hacia VM1

```bash
# A1. Cliente-Servidor responde
curl -s http://192.168.56.11:3000/ -w "\nHTTP %{http_code} | tiempo: %{time_total}s\n"

# A2. Crear tarea
curl -s -X POST http://192.168.56.11:3000/tasks -H "Content-Type: application/json" -d '{"titulo":"Tarea creada desde VM2","descripcion":"Prueba T1.6","updatedBy":"vm2"}' | jq

# A3. Listar tareas
curl -s http://192.168.56.11:3000/tasks | jq

# A4. Mover la tarea a "en_progreso"
ID=$(curl -s http://192.168.56.11:3000/tasks | jq -r '.[0].id')
curl -s -X PUT http://192.168.56.11:3000/tasks/$ID -H "Content-Type: application/json" -d '{"estado":"en_progreso","updatedBy":"vm2"}' | jq

# A5. P2P nodo 1 responde
curl -s http://192.168.56.11:4001/ | jq
```

### Bloque B — desde VM1 hacia VM2

```bash
# B1. P2P nodo 2 responde
curl -s http://192.168.56.12:4002/ | jq

# B2. Salud del microservicio
curl -s http://192.168.56.12:5001/health -w "\nHTTP %{http_code} | tiempo: %{time_total}s\n"

# B3. Crear tarea en el microservicio
curl -s -X POST http://192.168.56.12:5001/tasks -H "Content-Type: application/json" -d '{"titulo":"Tarea creada desde VM1","descripcion":"Prueba T1.6","updatedBy":"vm1"}' | jq

# B4. Marcarla como finalizada
ID=$(curl -s http://192.168.56.12:5001/tasks | jq -r '.[0].id')
curl -s -X PUT http://192.168.56.12:5001/tasks/$ID -H "Content-Type: application/json" -d '{"estado":"finalizada","updatedBy":"vm1"}' | jq

# B5. Eliminarla (esperado: HTTP 204)
curl -s -X DELETE http://192.168.56.12:5001/tasks/$ID -w "HTTP %{http_code}\n"

# B6. Lista vacía
curl -s http://192.168.56.12:5001/tasks | jq
```

### Bloque C — línea base P2P (Sprint 1)

```bash
# Crear tarea en el nodo 1
curl -s -X POST http://192.168.56.11:4001/tasks -H "Content-Type: application/json" -d '{"titulo":"Tarea del nodo 1","descripcion":"Prueba P2P"}' | jq

# Nodo 1: la tarea aparece
curl -s http://192.168.56.11:4001/tasks | jq

# Nodo 2: lista vacía []
curl -s http://192.168.56.12:4002/tasks | jq
```
---

## 11. Uso diario del entorno

### Encender y conectarse

1. VirtualBox → VM1 y VM2 → **Iniciar ▾ → Inicio sin interfaz**.
2. Esperar ~40 s.
3. `ssh grupo10@192.168.56.11` y `ssh grupo10@192.168.56.12`.
4. `docker ps` en cada una: los contenedores arrancan solos.

### Apagar

En cada sesión SSH: `sudo poweroff`.

### Actualizar un prototipo cuando alguien sube cambios a GitHub

Ejemplo con Cliente-Servidor en VM1 (repite la idea con cada contenedor en su VM):

```bash
cd ~/proyecto/servicios-telematicos-cliente-servidor
git pull
docker build -t tele-cliente-servidor .
docker rm -f tele-cs
docker run -d --name tele-cs --restart unless-stopped -p 3000:3000 tele-cliente-servidor
```

Es decir: **bajar cambios → reconstruir imagen → borrar el contenedor viejo → crear el nuevo**.

> ⚠️ **No programes dentro de las VMs.** Programa en tu PC, haz `git push`, y en las VMs solo haz `git pull`. Los cambios hechos dentro de una VM se pierden si se restaura una instantánea.

### Comandos Docker útiles

| Para… | Comando |
|---|---|
| Ver contenedores en ejecución | `docker ps` |
| Ver todos (incluidos detenidos) | `docker ps -a` |
| Ver mensajes de un contenedor | `docker logs tele-cs` |
| Ver mensajes en vivo (`Ctrl+C` para salir) | `docker logs -f tele-cs` |
| Ver CPU/RAM/red en vivo (`Ctrl+C` para salir) | `docker stats` |
| Detener / arrancar / reiniciar | `docker stop tele-cs` / `docker start tele-cs` / `docker restart tele-cs` |
| Borrar un contenedor | `docker rm -f tele-cs` |
| Ver imágenes | `docker images` |

---


---
