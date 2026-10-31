# AgroControl completo (web + API) en una sola imagen. Lo usa compose.yaml: `docker compose up`.
# 1) Compila el frontend y el backend con el perfil Maven `fullstack` (descarga su propio Node).
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
# Primero solo el pom: las dependencias quedan en caché mientras no cambie
COPY backend/pom.xml backend/pom.xml
RUN cd backend && mvn -B -q dependency:go-offline
COPY frontend frontend
COPY backend backend
RUN cd backend && mvn -B -q -Pfullstack -DskipTests package

# 2) Imagen final: solo Java y el jar
FROM eclipse-temurin:21-jre
# La base guarda UTC (hibernate.jdbc.time_zone); la aplicación trabaja en hora de Bolivia
ENV TZ=America/La_Paz
WORKDIR /app
COPY --from=build /app/backend/target/AgroControl-1.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
