import Phaser, { Physics } from 'phaser';

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      faune(x: number, y: number, texture: string, frame?: string | number);
    }
  }
}

enum HealthState {
  IDLE,
  DAMAGE,
  DEAD,
}

export default class Faune extends Phaser.Physics.Arcade.Sprite {
  private healthState = HealthState.IDLE;
  private damageTime = 0;
  private _health = 3;
  private knives?: Phaser.Physics.Arcade.Group;

  get health() {
    return this._health;
  }

  setKnives(knives: Phaser.Physics.Arcade.Group) {
    this.knives = knives;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame);

    this.anims.play('faune-idle-side');
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!cursors) {
      return;
    }
    if (
      this.healthState === HealthState.DAMAGE ||
      this.healthState === HealthState.DEAD
    ) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.space!)) {
      this.throwKnife();
    }
    const speed = 100;

    if (cursors.left?.isDown) {
      this.anims.play('faune-run-side', true);
      this.setVelocity(-speed, 0);
      this.scaleX = -1;
      this.body.offset.x = 24;
    } else if (cursors.right?.isDown) {
      this.anims.play('faune-run-side', true);
      this.setVelocity(speed, 0);
      this.scaleX = 1;
      this.body.offset.x = 8;
    } else if (cursors.up?.isDown) {
      this.anims.play('faune-run-up', true);
      this.setVelocity(0, -speed);
    } else if (cursors.down?.isDown) {
      this.anims.play('faune-run-down', true);
      this.setVelocity(0, speed);
    } else {
      const parts = this.anims.currentAnim.key.split('-');
      parts[1] = 'idle';
      this.anims.play(parts.join('-'));
      this.setVelocity(0, 0);
    }
  }

  private throwKnife() {
    if (!this.knives) {
      return;
    }
    const parts = this.anims.currentAnim.key.split('-');
    const direction = parts[2];

    const vec = new Phaser.Math.Vector2(0, 0);

    switch (direction) {
      case 'up':
        vec.y = -1;

        break;
      case 'down':
        vec.y = 1;
        break;
      default:
      case 'side':
        if (this.scaleX < 0) {
          vec.x = -1;
        } else {
          vec.x = 1;
        }
        break;
    }

    const angle = vec.angle();
    const knife = this.knives.get(
      this.x,
      this.y,
      'knife'
    ) as Phaser.Physics.Arcade.Image;
    knife.setActive(true);
    knife.setVisible(true);

    knife.setRotation(angle);

    knife.x += vec.x * 16;
    knife.y += vec.y * 16;
    knife.setVelocity(vec.x * 300, vec.y * 300);
  }

  handleDamage(dir: Phaser.Math.Vector2) {
    if (this.healthState === HealthState.DAMAGE) {
      return;
    }

    --this._health;

    if (this._health <= 0) {
      this.healthState = HealthState.DEAD;
      this.anims.play('faune-faint');

      this.setVelocity(0, 0);
    } else {
      this.setVelocity(dir.x, dir.y);

      this.setTint(0x0ff0000);
      this.healthState = HealthState.DAMAGE;
    }
  }

  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt);

    switch (this.healthState) {
      case HealthState.IDLE:
        break;
      case HealthState.DAMAGE:
        this.damageTime += dt;
        if (this.damageTime >= 250) {
          this.healthState = HealthState.IDLE;
          this.setTint(0xfffffff);
          this.damageTime = 0;
        }
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'faune',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    var sprite = new Faune(this.scene, x, y, texture, frame);

    this.displayList.add(sprite);
    this.updateList.add(sprite);

    this.scene.physics.world.enableBody(
      sprite,
      Phaser.Physics.Arcade.DYNAMIC_BODY
    );

    sprite.body.setSize(sprite.width * 0.5, sprite.height * 0.8);

    return sprite;
  }
);
