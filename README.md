# Protected property

The proposal is an enhancement of private property of class and object literals.(@[here](https://github.com/aimingoo/private-property)).

The proposal will provide `protected` keyword and implementations in class definitions and has the following advantages:

* Simple and prototype based
* No new components and less changes. 
* Easy to implement and clean concept.


The proposal is not tc39 officailly now but implemented at [prepack-core with proposal-protected-property](https://github.com/aimingoo/prepack-core/tree/proposal-protected-property) ([@here](https://github.com/aimingoo/prepack-core/tree/proposal-protected-property)).

You could see more test case in this project ([@here](#testcases)).

## Usage

**1. How to declare *protected* properties in a class definition** 

The usage of  keyword *protected* is same as private property definition,  for example:

```java
// define protected property in class
class f {
    // protected property will be created at prototype
    protected data = 100;
    // protected property for class
    protected static data = 200;
    // declaration list (maybe)
    protected x, y, z = 100;

    ...
}

// define protected method and accessor in class
class f {
    protected get data() { ... };
    protected foo() { ... };
 
    // for static ...
    ... 
}

// in object literal definition
// (no support)
```

**2. How to access protected properties**

It is also same as private property access:

```javascript
class MyClass {
  protected x = 100;
  foo() {
    console.log(x); // accept in current class
  }
}
class MyClassEx extends MyClass {
  foo() {
    console.log(x); // accept in child class
  }
}
```



**3. How to solve identifier (property name) corrpution in child classes**

In some occasions, you will want to give an alias for an inherited protected property. 

you can use `private as` syntax in child class:

```java
class MyClass {
  protected x = 100;
}

class MyClassEx extends MyClass {
  private x as y; // when you want access inherited protected property with a new identifier
  foo(x) {
    console.log(x); // yes, arguments-x
    console.log(y); // alias of inhrited `x`
  }
}
```

And as a syntactic sugar,  you can also use *as* keyword to declare an alias for a defined private property:

```java
class MyClass {
  private x = 100;
  private x as y;
  foo() {
    console.log(x); // nop!
    console.log(y); // 100
  }
}
```

**4. Update visibility in child classes**

Override `protected` visibility in child class:

```java
class MyClass {
  private x = 100;
}

class MyClassEx extends MyClass {
  protected as x; // set `private` for inherited protected `x`
}

class MyClassEx2 extends MyClassEx {
  foo() {
    consoel.log(x); // nop!
  }
}
```



## Syntax summary

* Define visibility with `private` and `protected `keyword.

  ```javascript
  Example:
    private x;
  
  Syntax:
  <private|protected> [static] name [= value] [, …]			
  <private|protected> [static] [get | set] methodName ( argumentsList ) { … }
  ```

   > NOTE: support async and generator.

* Allow private member access in internal

  ```javascript
  Ex:
    internal private x;
  
  <internal> <private|protected> name [= value] [, …]
  <internal> <private|protected> [get | set] methodName ( argumentsList ) { … }
  ```

   > NOTE: The scope for private is the current class. The one for protected properties include his child-classes.
   >
   > NOTE: The `internal` prefix can not support for `static` definition.

* Use identifier to access private members

  ```javascript
  Ex:
    x
  
  Identifier::
    IdentifierName but not ReservedWord.
  ```

* Use internal scope reference for instances

  ```javascript
  Ex:
    this[internal.x]
  
  object[<internal>.name]
  ```

  > NOTE: the reference is computed property for instance object of AClass.
>
>NOTE: the computed property name is propertyReference base on ***internal*** object. the latter is names map of internal member in AClass.

* Create alias, will hide inheritance name that exists in current private scope

  ```javascript
  Ex:
    private y as x;
  
  Syntax:
  <private|protected> [static] <parentProtectedName> as <newlyName> [= value];
  <private|protected> [static] <parentProtectedName> as [get | set] methodName ( argumentsList ) { … }
  ```

  > NOTE: the `parentProectedName` is inherited name from parent class.
  >
  > NOTE: maybe, the `private ... as` can support privated name in current scope.

* Override visibility or internal access prefix for inherited protected property,  and/or update value

  ```javascript
  Ex:
    private as x;
  
  Syntax:
  [internal] <private|protected> [static] as <parentProtectedName> [= value];
  [internal] <private|protected> [static] as [get | set] <parentProtectedName>( argumentsList ) { … }
  ```

  > NOTE: internal access privilege will inherited for `protected` definition, you can reset it with `internal` prefix in child-classes base on `<private|protected> as` syntax.



## Concepts

The protected property is object instance's private member too, it was defined only in class definition. private and protected is all of object's private scope/domain.

If a private member is protected, the member will be visible in current class and its all child-classes. For protected property, the orginal value, attributes of property descriptor, and internal access privilege are inherited too.

A protected property can be overridden by any of its subclasses in the scope of the subclass. The items covered includes its value, visibility, and IAP privileges.



## Implementation

### Main processes

**Core rules:**

- not possible to access a private member of an object when his Class unaware. so,
- not possible to directly access private scope outside of the Class declaration.

**Key implementation steps:**

- Set prototype of `AClass.prototype.[[Private]]` to its `[[Protected]]`, and set prototype of `[[Protected]]` to `ParentClass_Of_AClass.prototype.[[Protected]]`. The `[[Protected]]` internal slot of AClass and its parent-class similar to this.

Done.

### Syntax `as` implementation

* function *setVisibleInScope(target, key)*

  Let *unscopables* to be value of @@unscopables from symbol properties of *target*. set *unscopables*[*key*] to false.

* function *setInvisibleInScope(target, key)*

  Let *unscopables* to be value of @@unscopables from symbol properties of *target*. set *unscopables*[*key*] to true.

> Note: Visibility is managed by @@unscopable, and @@unscopable is also implemented based on the prototype inheritance chain of `[[Protected]]` of AClass.prototype or AClass.
>
> Note: The *targetObject* is **AClass** of static method definetion in class define, otherwise be **AClass.protoype**.

#### syntax ` private as b`

- in PropertyDefinitionEvaluation()

  Let *downgrading* to be true when `b` protected and will set visibility to `private`, otherwise false.

  Let *fromScope* to be *targetObject*.[[Protected]]. Let *toScope* to be *targetObject*.[[Private]] when *downgrading*, otherwise set *toScope* equ *fromScope*.

  If `downgrading` is true, let *privateSymbol* to be private-key of name `b` from protected members by *fromScope*.\[\[Get\]\]() method, and create new property named `b` in *toScope* , set its value to be *privateSymbol*.

  Call setInvisibleInScope(*fromScope*, 'b'), and call setVisibleInScope(*toScope*, 'b').

Done.

#### syntax private a as b

- in PropertyDefinitionEvaluation()

  Let *targetScope* to be *targetObject*.[[Protected]] for syntax `protected...`, otherwise set to *targetObject*.[[Private]].

  Let *privateSymbol* to be private-key of name `a` from protected members by *targetObject*.\[\[Protected\]\].\[\[Get\]\]() method, and create new property named `b` in *targetScope*, set its value to be *privateSymbol*. 

  Call setInvisibleInScope(*targetScope*, 'a'), and call setVisibleInScope(*targetScope*, 'b'). 

Done.

> Note: Will be create new private member `b` when using syntax `private a as b`. The difference is update only visibility or IAP or value on existing `b` when using `private as b`.


## Completed and planning

- [x] Class definition
- [x] protected property features
  - [x] override visibility
  - [x] private *\<parentProtectedName\>* as \<*alias*\>
  - [x] (un)set internal access privilege
- [ ] destructuring assignment (maybe)
- [ ] declaration list (maybe)
- [x] other same features of private property



## FAQ

* alias?

  in child-classes, you know a protected name in parent but cant change it. and maybe you want access outer scope but impact with that name. for the case, you need set a alias for that name. ex:

  ```javascript
  var x = 100;
  
  class MyClass {
    protected x = 200;
  }
  
  class MyClassEx extends MyClass {
    // I want access global-x, so set alias for protected-x
    private x as xxx; // xxx in current private-scope only
  
    foo() {
      console.log(x); // 100
      console.log(xxx); // 200, inherited
    }
  }
  ```



## Testcases

The proposal has full test case in repository, current syntax based.

```bash
# install test framework
> mkdir node_modules
> npm install fancy-test chai mocha --no-save
# test it
> mocha

# (OR)
> bash run.sh
```



## References

* [Objections to fields, especially the private field syntax](https://github.com/tc39/proposal-class-fields/issues/150)
* [The proposal should be rejected!](https://github.com/tc39/proposal-class-fields/issues/148)
* [My comments at #100](https://github.com/tc39/proposal-class-fields/issues/100#issuecomment-429533532)



## History

2019.09.06 draft-1 release.

2019.08.22 initial release.
