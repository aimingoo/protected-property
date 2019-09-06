var execute = require('./prepack-core/prepack.min.js').default;
var fancy = require('fancy-test').fancy;
var expect = require('chai').expect;

describe("Simple class declaration", ()=> {
	fancy.stdout().stderr().
	it('Simple protected property', output => {
		execute(`
			class MyClass {
				protected x = 100;
			}
			class MyClassEx extends MyClass {
				foo() {
					console.log(x);
				}
			}
			(new MyClassEx).foo();
		`);
		expect(output.stdout).to.eql('100\n');
	});

	fancy.stdout().stderr().
	it('Simple static protected property', output => {
		execute(`
			class MyClass {
				protected static x = 200;
			}
			class MyClassEx extends MyClass {
				static foo() {
					console.log(x);
				}
			}
			MyClassEx.foo();
		`);
		expect(output.stdout).to.eql('200\n');
	});
});

describe("Simple super access with protected property", ()=> {
	fancy.stdout().stderr().
	it('Simple super call', output => {
		execute(`
			class MyClass {
				protected static x = 100;
				static foo() {
					console.log(x);
				}

				protected x = 200;
				foo() {
					console.log(x);
				}
			}
			class MyClassEx extends MyClass {
				static foo() {
					super.foo();
				}
				foo() {
					super.foo();
				}
			}
			MyClassEx.foo();
			(new MyClassEx).foo();
		`);
		expect(output.stdout).to.eql('100\n200\n');
	});
});

describe("Visibility management", ()=> {
	fancy.stdout().stderr().
	it('Override inherited protected property', output => {
		execute(`
			var x = 'outer';
			class MyClass {
				protected x = 100;
			}
			class MyClassEx extends MyClass {
				private as x;
				foo() {
					console.log(x);
				}
			}
			class MyClassEx2 extends MyClassEx {
				check() {
					console.log(x);
				}
			}
			(new MyClassEx).foo();
			(new MyClassEx2).check();
		`);
		expect(output.stdout).to.eql('100\nouter\n');
	});

	fancy.stdout().stderr().
	it('Override and update inherited protected property', output => {
		execute(`
			class MyClass {
				protected x = 100;
				foo() {
					console.log(x);
				}
			}
			class MyClassEx extends MyClass {
				private as x = 200;
				foo() {
					super.foo();
					console.log(x);
				}
			}
			(new MyClassEx).foo();
		`);
		expect(output.stdout).to.eql('200\n200\n');
	});

	fancy.stdout().stderr().
	it('make alias of inherited protected property', output => {
		execute(`
			var x = 'outer';
			class MyClass {
				protected x = 100;
			}
			class MyClassEx extends MyClass {
				private x as y = 200;  // x hidden in private scope
				foo() {
					console.log(y);
					console.log(x);
				}
			}
			class MyClassEx2 extends MyClassEx {
				foo() {
					super.foo();
					console.log(x);
				}
			}
			(new MyClassEx2).foo();
		`);
		expect(output.stdout).to.eql('200\nouter\n100\n');
	});

	fancy.stdout().stderr().
	it('make alias and override of inherited protected property', output => {
		execute(`
			var x = 'outer';
			class MyClass {
				protected x = 100;
			}
			class MyClassEx extends MyClass {
				protected x as y = 200;  // x hidden in protected scope
				foo() {
					console.log(y);
					console.log(x);
				}
			}
			class MyClassEx2 extends MyClassEx {
				foo() {
					super.foo();
					console.log(x);
				}
			}
			(new MyClassEx2).foo();
		`);
		expect(output.stdout).to.eql('200\nouter\nouter\n');
	});
});

describe("Internal access", ()=> {
	fancy.stdout().stderr().
	it('In prototype and class method', output => {
		execute(`
			class MyClass {
				internal protected x = new Object;
			}
			class MyClassEx extends MyClass {
				foo() {
					return x === this[internal.x];
				}
				static foo(obj) {
					return super.prototype[internal.x] === obj[internal.x];
				}
			}
			var obj = new MyClassEx;
			console.log(obj.foo());
			console.log(MyClassEx.foo(obj));
		`);
		expect(output.stdout).to.eql('true\ntrue\n');
	});
});

describe("Hijack method", ()=> {
	fancy.stdout().stderr().
	it('Try same protected name access', output => {
		execute(`
			var x = 'global';

			class MyClass {
				protected x = 100;
			}

			class OtherClass {
				private x = 200;
				foo() {
					console.log(x);
				}
			}

			var a = new MyClass;
			var b = new OtherClass;
			b.foo.call(a);
		`);
		expect(output.stdout).to.eql('undefined\n');
	});

	fancy.stdout().stderr().
	it('Try force set prototype', output => {
		execute(`
			var x = 'global';

			class MyClass {
				protected x = 100;
				foo() {
					console.log(x);
				}
			}

			class OtherClass {
				private x = 200;
				foo() {
					console.log(x);
				}
			}

			var b = new OtherClass;
			Object.setPrototypeOf(b, MyClass.prototype);
			OtherClass.prototype.foo.call(b);
			b.foo(); // point to MyClass.prototype.foo
		`);
		expect(output.stdout).to.eql('200\nundefined\n');
	});
});
